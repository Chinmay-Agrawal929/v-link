fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: "Hello", history: [] })
}).then(async res => {
  console.log("Status:", res.status);
  const reader = res.body.getReader();
  while(true) {
    const {done, value} = await reader.read();
    if(done) break;
    console.log(new TextDecoder().decode(value));
  }
}).catch(console.error);
