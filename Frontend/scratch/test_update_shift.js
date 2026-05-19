async function test() {
  try {
    console.log('1. Attempting login as admin...');
    const loginRes = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin', password: 'Admin123' })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    console.log('✅ Login successful! Token acquired.');

    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n2. Fetching all shifts...');
    const shiftsRes = await fetch('http://127.0.0.1:5000/api/v1/shift-assignment', { headers });
    
    if (!shiftsRes.ok) {
      throw new Error(`Fetch shifts failed with status ${shiftsRes.status}: ${await shiftsRes.text()}`);
    }
    
    const shiftsData = await shiftsRes.json();
    const shifts = shiftsData.data;
    console.log(`✅ Fetched ${shifts.length} shifts.`);

    if (shifts.length === 0) {
      console.log('❌ No shifts found to test update on. Please create a shift first.');
      return;
    }

    const targetShift = shifts[0];
    console.log('\nTarget Shift details:', {
      id: targetShift.id,
      employee_id: targetShift.employee_id,
      shift_time: targetShift.shift_time,
      start_date: targetShift.start_date,
      end_date: targetShift.end_date
    });

    console.log('\n3. Attempting PATCH update on target shift...');
    const updateRes = await fetch(
      `http://127.0.0.1:5000/api/v1/shift-assignment/${targetShift.id}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          shift_time: '10:00 AM - 06:00 PM',
          start_date: targetShift.start_date.split('T')[0],
          end_date: null
        })
      }
    );
    
    console.log('✅ Update response status:', updateRes.status);
    const updateData = await updateRes.json();
    console.log('✅ Update response body:', JSON.stringify(updateData, null, 2));

  } catch (error) {
    console.error('❌ Error during update test:', error.message);
  }
}

test();
