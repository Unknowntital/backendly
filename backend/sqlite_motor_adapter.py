import json
from datetime import datetime
from typing import Dict, Any, List
import aiosqlite

class Cursor:
    def __init__(self, collection, query, projection=None):
        self.collection = collection
        self.query = query
        self.projection = projection
        self._sort = None

    def sort(self, field, direction):
        self._sort = (field, "DESC" if direction == -1 else "ASC")
        return self

    async def to_list(self, length):
        where_clause, values = self.collection._build_where(self.query)
        query_sql = f"SELECT * FROM {self.collection.name}"
        if where_clause:
            query_sql += f" WHERE {where_clause}"
        if self._sort:
            query_sql += f" ORDER BY {self._sort[0]} {self._sort[1]}"
        if length:
            query_sql += f" LIMIT {length}"
        
        async with self.collection.db.execute(query_sql, values) as cursor:
            rows = await cursor.fetchall()
            cols = [description[0] for description in cursor.description]
            return [self.collection._row_to_dict(dict(zip(cols, row))) for row in rows]

class Collection:
    def __init__(self, name: str, db: aiosqlite.Connection):
        self.name = name
        self.db = db

    def _build_where(self, query: Dict[str, Any]):
        if not query:
            return "", []
        clauses = []
        values = []
        for k, v in query.items():
            if k == "_id":
                continue # ignore mongo ids
            if self.name == "project_records" and k not in ["record_id", "project_id", "table_id", "created_at"]:
                # json query
                clauses.append(f"json_extract(data, '$.{k}') = ?")
                values.append(str(v) if not isinstance(v, (int, float, bool)) else v)
            else:
                clauses.append(f"{k} = ?")
                values.append(v)
        return " AND ".join(clauses), values

    def _row_to_dict(self, d):
        if not d:
            return None
        if "data" in d and d["data"] is not None:
            data = json.loads(d["data"])
            del d["data"]
            d.update(data)
        if "fields" in d and isinstance(d["fields"], str):
            d["fields"] = json.loads(d["fields"])
        return d

    async def find_one(self, query: Dict[str, Any], projection=None):
        where_clause, values = self._build_where(query)
        sql = f"SELECT * FROM {self.name}"
        if where_clause:
            sql += f" WHERE {where_clause}"
        sql += " LIMIT 1"
        
        async with self.db.execute(sql, values) as cursor:
            row = await cursor.fetchone()
            if row:
                cols = [description[0] for description in cursor.description]
                return self._row_to_dict(dict(zip(cols, row)))
            return None

    def find(self, query: Dict[str, Any], projection=None):
        return Cursor(self, query, projection)

    async def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            del doc_copy["_id"]
            
        if self.name == "project_records":
            record_id = doc_copy.pop("record_id", None)
            project_id = doc_copy.pop("project_id", None)
            table_id = doc_copy.pop("table_id", None)
            created_at = doc_copy.pop("created_at", None)
            
            data = json.dumps(doc_copy)
            sql = f"INSERT INTO {self.name} (record_id, project_id, table_id, data, created_at) VALUES (?, ?, ?, ?, ?)"
            await self.db.execute(sql, (record_id, project_id, table_id, data, str(created_at)))
        elif self.name == "project_tables":
            if "fields" in doc_copy:
                doc_copy["fields"] = json.dumps(doc_copy["fields"])
            keys = list(doc_copy.keys())
            values = list(doc_copy.values())
            placeholders = ", ".join("?" for _ in values)
            sql = f"INSERT INTO {self.name} ({', '.join(keys)}) VALUES ({placeholders})"
            await self.db.execute(sql, values)
        else:
            # Convert datetime to string for sqlite
            for k, v in doc_copy.items():
                if isinstance(v, datetime):
                    doc_copy[k] = v.isoformat()
            keys = list(doc_copy.keys())
            values = list(doc_copy.values())
            placeholders = ", ".join("?" for _ in values)
            sql = f"INSERT INTO {self.name} ({', '.join(keys)}) VALUES ({placeholders})"
            await self.db.execute(sql, values)
        
        await self.db.commit()
        class InsertResult:
            inserted_id = "sqlite_id"
        return InsertResult()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        where_clause, where_values = self._build_where(query)
        
        set_clauses = []
        set_values = []
        
        if "$set" in update:
            for k, v in update["$set"].items():
                if self.name == "project_records" and k not in ["record_id", "project_id", "table_id", "created_at"]:
                    set_clauses.append(f"data = json_set(data, '$.{k}', ?)")
                    set_values.append(v)
                else:
                    set_clauses.append(f"{k} = ?")
                    set_values.append(v if not isinstance(v, datetime) else v.isoformat())
                
        if not set_clauses:
            return
            
        sql = f"UPDATE {self.name} SET {', '.join(set_clauses)} WHERE {where_clause}"
        all_values = set_values + where_values
        await self.db.execute(sql, all_values)
        await self.db.commit()

    async def delete_one(self, query: Dict[str, Any]):
        where_clause, values = self._build_where(query)
        sql = f"DELETE FROM {self.name} WHERE {where_clause}"
        cursor = await self.db.execute(sql, values)
        await self.db.commit()
        class DeleteResult:
            deleted_count = cursor.rowcount
        return DeleteResult()

    async def delete_many(self, query: Dict[str, Any]):
        where_clause, values = self._build_where(query)
        sql = f"DELETE FROM {self.name}"
        if where_clause:
            sql += f" WHERE {where_clause}"
        cursor = await self.db.execute(sql, values)
        await self.db.commit()
        class DeleteResult:
            deleted_count = cursor.rowcount
        return DeleteResult()

    async def count_documents(self, query: Dict[str, Any]):
        where_clause, values = self._build_where(query)
        sql = f"SELECT COUNT(*) FROM {self.name}"
        if where_clause:
            sql += f" WHERE {where_clause}"
        async with self.db.execute(sql, values) as cursor:
            row = await cursor.fetchone()
            return row[0] if row else 0

    async def create_index(self, *args, **kwargs):
        pass

class DatabaseWrapper:
    def __init__(self, db: aiosqlite.Connection):
        self.db = db
        self._collections = {}

    def __getattr__(self, name):
        if name not in self._collections:
            self._collections[name] = Collection(name, self.db)
        return self._collections[name]
