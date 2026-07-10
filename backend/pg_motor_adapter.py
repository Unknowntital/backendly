import json
from datetime import datetime
from typing import Dict, Any, List


def _parse_date(v):
    if isinstance(v, str) and len(v) >= 19 and "T" in v:
        try:
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            pass
    return v


class Cursor:
    def __init__(self, collection, query, projection=None):
        self.collection = collection
        self.query = query
        self.projection = projection
        self._sort = None
        self._skip = 0
        self._limit_val = None

    def sort(self, field, direction):
        self._sort = (field, "DESC" if direction == -1 else "ASC")
        return self

    def skip(self, n):
        self._skip = n
        return self

    def limit(self, n):
        self._limit_val = n
        return self

    def _build_query(self):
        where_clause, values = self.collection._build_where(self.query)
        query_sql = f"SELECT * FROM {self.collection.name}"
        if where_clause:
            query_sql += f" WHERE {where_clause}"
        if self._sort:
            query_sql += f" ORDER BY {self._sort[0]} {self._sort[1]}"
        if self._limit_val is not None:
            query_sql += f" LIMIT {self._limit_val}"
        if self._skip:
            query_sql += f" OFFSET {self._skip}"
        return query_sql, values

    async def to_list(self, length):
        query_sql, values = self._build_query()
        if length and self._limit_val is None:
            query_sql += f" LIMIT {length}"
        rows = await self.collection.pool.fetch(query_sql, *values)
        return [self.collection._row_to_dict(row) for row in rows]

    # async for support
    def __aiter__(self):
        self._iter_started = False
        self._iter_rows = None
        self._iter_idx = 0
        return self

    async def __anext__(self):
        if not self._iter_started:
            self._iter_started = True
            query_sql, values = self._build_query()
            self._iter_rows = await self.collection.pool.fetch(query_sql, *values)
            self._iter_idx = 0
        if self._iter_idx >= len(self._iter_rows):
            raise StopAsyncIteration
        row = self._iter_rows[self._iter_idx]
        self._iter_idx += 1
        return self.collection._row_to_dict(row)


# Map table names to their known real columns (from schema.sql)
# Any key NOT in this set gets treated as a JSONB data->>'key' query
TABLE_COLUMNS = {
    "users": {"user_id", "email", "name", "picture", "auth_provider", "password_hash", "created_at"},
    "user_sessions": {"session_token", "user_id", "expires_at", "created_at"},
    "password_resets": {"reset_token", "user_id", "email", "expires_at", "used", "created_at"},
    "projects": {"project_id", "user_id", "name", "region", "created_at"},
    "team_invites": {"invite_id", "owner_id", "email", "name", "role", "status", "created_at"},
    "project_tables": {"table_id", "project_id", "name", "fields", "created_at"},
    "project_records": {"record_id", "project_id", "table_id", "data", "created_at", "updated_at"},
    "api_keys": {"key_id", "project_id", "name", "key_hash", "prefix", "last4", "last_used_at", "created_at"},
    "request_logs": {"id", "project_id", "api_key_id", "method", "path", "status", "bytes", "created_at"},
    "end_users": {"end_user_id", "project_id", "email", "name", "password_hash", "metadata", "email_verified", "created_at"},
    "end_user_sessions": {"token", "project_id", "end_user_id", "expires_at", "created_at"},
    "status_checks": {"id", "client_name", "timestamp"},
    "contact_messages": {"id", "name", "email", "company", "subject", "message", "created_at"},
    "newsletter_subscribers": {"id", "email", "created_at"},
}


class Collection:
    def __init__(self, name: str, pool):
        self.name = name
        self.pool = pool

    def _is_real_column(self, key):
        cols = TABLE_COLUMNS.get(self.name)
        if cols is None:
            return True  # unknown table, assume direct columns
        return key in cols

    def _build_where(self, query: Dict[str, Any]):
        if not query:
            return "", []
        clauses = []
        values = []
        i = 1
        for k, v in query.items():
            if k == "_id":
                continue  # ignore mongo ids
            if isinstance(v, dict):
                # Handle operators like $in, $gte, $lte, $ne
                for op, op_val in v.items():
                    if op == "$in":
                        placeholders = ", ".join(f"${i + j}" for j in range(len(op_val)))
                        if self._is_real_column(k):
                            clauses.append(f"{k} IN ({placeholders})")
                        else:
                            clauses.append(f"data->>'{k}' IN ({placeholders})")
                        for item in op_val:
                            values.append(str(item) if not self._is_real_column(k) else item)
                            i += 1
                        continue
                    elif op == "$gte":
                        if self._is_real_column(k):
                            clauses.append(f"{k} >= ${i}")
                        else:
                            clauses.append(f"data->>'{k}' >= ${i}")
                        values.append(op_val)
                        i += 1
                        continue
                    elif op == "$lte":
                        if self._is_real_column(k):
                            clauses.append(f"{k} <= ${i}")
                        else:
                            clauses.append(f"data->>'{k}' <= ${i}")
                        values.append(op_val)
                        i += 1
                        continue
                    elif op == "$ne":
                        if self._is_real_column(k):
                            clauses.append(f"{k} != ${i}")
                        else:
                            clauses.append(f"data->>'{k}' != ${i}")
                        values.append(op_val)
                        i += 1
                        continue
            else:
                if self._is_real_column(k):
                    clauses.append(f"{k} = ${i}")
                    values.append(_parse_date(v))
                else:
                    clauses.append(f"data->>'{k}' = ${i}")
                    values.append(str(v))
                i += 1
        return " AND ".join(clauses), values

    def _row_to_dict(self, row):
        if not row:
            return None
        d = dict(row)
        if "data" in d and d["data"] is not None:
            if isinstance(d["data"], str):
                data = json.loads(d["data"])
            else:
                data = dict(d["data"]) if hasattr(d["data"], 'items') else d["data"]
            del d["data"]
            d.update(data)
        if "fields" in d and isinstance(d["fields"], str):
            d["fields"] = json.loads(d["fields"])
        if "metadata" in d and isinstance(d["metadata"], str):
            d["metadata"] = json.loads(d["metadata"])
        return d

    async def find_one(self, query: Dict[str, Any], projection=None):
        where_clause, values = self._build_where(query)
        sql = f"SELECT * FROM {self.name}"
        if where_clause:
            sql += f" WHERE {where_clause}"
        sql += " LIMIT 1"
        row = await self.pool.fetchrow(sql, *values)
        return self._row_to_dict(row)

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
            created_at = _parse_date(doc_copy.pop("created_at", None))
            updated_at = _parse_date(doc_copy.pop("updated_at", None))

            data = json.dumps(doc_copy)
            sql = f"INSERT INTO {self.name} (record_id, project_id, table_id, data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)"
            await self.pool.execute(sql, record_id, project_id, table_id, data, created_at, updated_at or created_at)
        elif self.name == "project_tables":
            if "fields" in doc_copy:
                doc_copy["fields"] = json.dumps(doc_copy["fields"])
            keys = list(doc_copy.keys())
            values = list(doc_copy.values())
            placeholders = ", ".join(f"${i+1}" for i in range(len(values)))
            sql = f"INSERT INTO {self.name} ({', '.join(keys)}) VALUES ({placeholders})"
            await self.pool.execute(sql, *values)
        else:
            # Serialize any dict/list values as JSON for JSONB columns
            processed = {}
            for k, v in doc_copy.items():
                if k == "metadata" and isinstance(v, (dict, list)):
                    processed[k] = json.dumps(v)
                else:
                    processed[k] = _parse_date(v)
            keys = list(processed.keys())
            values = list(processed.values())
            placeholders = ", ".join(f"${i+1}" for i in range(len(values)))
            sql = f"INSERT INTO {self.name} ({', '.join(keys)}) VALUES ({placeholders})"
            await self.pool.execute(sql, *values)

        class InsertResult:
            inserted_id = "pg_id"
        return InsertResult()

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        where_clause, where_values = self._build_where(query)

        set_clauses = []
        set_values = []
        i = len(where_values) + 1

        if "$set" in update:
            for k, v in update["$set"].items():
                if self._is_real_column(k):
                    set_clauses.append(f"{k} = ${i}")
                    if k == "metadata" and isinstance(v, (dict, list)):
                        set_values.append(json.dumps(v))
                    else:
                        set_values.append(_parse_date(v))
                elif k.startswith("data."):
                    # Update a key inside JSONB data column
                    json_key = k.split(".", 1)[1]
                    set_clauses.append(f"data = jsonb_set(COALESCE(data, '{{}}'::jsonb), '{{\"{json_key}\"}}', ${i}::jsonb)")
                    set_values.append(json.dumps(v))
                else:
                    # Fallback: treat as JSONB data key
                    set_clauses.append(f"data = jsonb_set(COALESCE(data, '{{}}'::jsonb), '{{\"{k}\"}}', ${i}::jsonb)")
                    set_values.append(json.dumps(v))
                i += 1

        if not set_clauses:
            class EmptyResult:
                matched_count = 0
            return EmptyResult()

        sql = f"UPDATE {self.name} SET {', '.join(set_clauses)} WHERE {where_clause}"
        all_values = where_values + set_values
        status = await self.pool.execute(sql, *all_values)

        count = int(status.split()[-1]) if status.startswith("UPDATE") else 0
        class UpdateResult:
            pass
        result = UpdateResult()
        result.matched_count = count
        return result

    async def delete_one(self, query: Dict[str, Any]):
        where_clause, values = self._build_where(query)
        sql = f"DELETE FROM {self.name} WHERE {where_clause}"
        status = await self.pool.execute(sql, *values)

        class DeleteResult:
            deleted_count = int(status.split()[-1]) if status.startswith("DELETE") else 0
        return DeleteResult()

    async def delete_many(self, query: Dict[str, Any]):
        where_clause, values = self._build_where(query)
        sql = f"DELETE FROM {self.name}"
        if where_clause:
            sql += f" WHERE {where_clause}"
        status = await self.pool.execute(sql, *values)

        class DeleteResult:
            deleted_count = int(status.split()[-1]) if status.startswith("DELETE") else 0
        return DeleteResult()

    async def count_documents(self, query: Dict[str, Any]):
        where_clause, values = self._build_where(query)
        sql = f"SELECT COUNT(*) FROM {self.name}"
        if where_clause:
            sql += f" WHERE {where_clause}"
        val = await self.pool.fetchval(sql, *values)
        return val

    async def create_index(self, *args, **kwargs):
        pass  # Managed by schema.sql


class Database:
    def __init__(self, pool):
        self.pool = pool
        self._collections = {}

    def __getattr__(self, name):
        if name not in self._collections:
            self._collections[name] = Collection(name, self.pool)
        return self._collections[name]
