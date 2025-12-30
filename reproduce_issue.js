const http = require('http');

const data = JSON.stringify({
  email: `test_user_${Date.now()}@example.com`,
  password: 'password123',
  phone: `123456789${Date.now() % 10}`,
  first_name: 'Test',
  last_name: 'User',
  role: 'staff'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('BODY:', body);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
