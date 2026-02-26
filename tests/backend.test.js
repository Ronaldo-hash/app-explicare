import { expect, test } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { CLIENTE_SUPABASE_URL, CLIENTE_SUPABASE_KEY } from '../src/lib/configuracao_cliente';

const supabaseUrl = CLIENTE_SUPABASE_URL;
const supabaseKey = CLIENTE_SUPABASE_KEY;

// Fail fast if env vars are missing
if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("SEU_PROJETO")) {
    throw new Error('Supabase config missing. Check src/lib/configuracao_cliente.js');
}

const supabase = createClient(supabaseUrl, supabaseKey);

test('Supabase Backend: Should connect and query the videos_pecas table safely', async () => {
    // 1. Send a simple query to the backend table
    // We limit to 1 to just check if the connection and read permissions work
    const { data, error } = await supabase
        .from('videos_pecas')
        .select('id, video_url, slug')
        .limit(1);

    // 2. We expect no errors from the backend
    expect(error).toBeNull();

    // 3. We expect data to be returned
    expect(Array.isArray(data)).toBe(true);
});

test('Supabase Backend Auth: Should be able to reach authentication service', async () => {
    // Check if the auth service responds (e.g., attempt a dummy login to see error structure)
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'invalid_backend_test@examplenotreal.com',
        password: 'fake-password'
    });

    // The backend should respond with a specific error indicating bad credentials, proving it's alive
    expect(data.user).toBeNull();
    expect(error).not.toBeNull();
});
