const express = require('express');
const app = express();
const cors = require('cors'); // Need to install cors in this test dir, or just serve without it
app.use(express.static('.'));
app.listen(8080, () => console.log('Server running on 8080'));
