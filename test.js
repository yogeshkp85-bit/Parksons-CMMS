async function run() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'yogeshkp85@gmail.com', password: 'PKS@2026' })
    });
    const data = await res.json();
    const token = data.data.token;
    
    // Test PM Frequencies with Token
    const res2 = await fetch('http://localhost:5000/api/pm/frequencies', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Frequencies success:', await res2.json());
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
