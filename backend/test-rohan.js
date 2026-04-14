import http from 'http';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIyMmQyYTNlLWRhOWYtNDRmMi04NmZmLTg4ZmM4NDY5NTJlNSIsImVtYWlsIjoicm9oYW5AZ21haWwuY29tIiwicm9sZSI6IkFETUlOIiwibmFtZSI6IlJvaGFuIiwiaW5zdGl0dXRlSWQiOiJiOWUyZGRiOS1iZWNjLTQ4MGQtYjAxZS02ZjI2YWI5MDUxYTAiLCJpYXQiOjE3NzYwMjY0NjR9.5nAoz0gAvP_j2ZFZTeXxYL4tE8I_TLIgo7lbhec-pj8';

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/batch/admin/batches',
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', e => console.error('Error:', e.message));
req.end();