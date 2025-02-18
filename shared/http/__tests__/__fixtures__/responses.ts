export const mockResponses = {
    success: (data = {}) => new Response(JSON.stringify(data), { status: 200 }),
    notFound: () => new Response(JSON.stringify({ message: 'Not found' }), { status: 404 }),
    serverError: () => new Response(JSON.stringify({ message: 'Server error' }), { status: 500 }),
    malformed: () => new Response('invalid json', { status: 200 }),
};
