const axios = require('axios');
(async () => {
    try {
        const res = await axios.post('http://localhost:8000/api/auth/session', { session_id: 'fake' });
        console.log(res.data);
    } catch (e) {
        console.log(e.response ? e.response.status + ' ' + e.response.data.detail : e.message);
    }
})();
