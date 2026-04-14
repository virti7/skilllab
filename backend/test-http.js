import http from 'http';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMyZWE1YzJlLWNhNTYtNDc0MC1iNDk1LTE4MmYyZDU4NjhjOSIsImVtYWlsIjoibWVodGF2ZWQxMkBnbWFpbC5jb20iLCJyb2xlIjoiQURNSU4iLCJuYW1lIjoiVmVkIE1laHRhIiwiaW5zdGl0dXRlSWQiOiIxN2QyMjI1MC0wZmRiLTQ5MmUtODI2MC0wM2VhMWY1Njc4OTkiLCJpYXQiOjE3NzYwMjYyNzV9.ImV0n6ex29JxAcRC6QQqkKjTuYG14ZT23PLbb8jSw7o';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/batch/admin/batches',
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', e => console.error('Error:', e.message));
req.end();