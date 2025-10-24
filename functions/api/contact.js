/**
 * Contact Form API
 * Handles contact form submissions from students and recruiters
 */

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { role, name, email, phone, subject, message } = data;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({
        error: 'Champs requis manquants'
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        error: 'Email invalide'
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Message length validation
    if (message.trim().length < 10) {
      return new Response(JSON.stringify({
        error: 'Message trop court (minimum 10 caractères)'
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Log the contact (in production, send email or save to DB)
    console.log('Contact form submission:', {
      role,
      name,
      email,
      phone,
      subject,
      message,
      timestamp: new Date().toISOString()
    });

    // TODO: In production, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Integrate with your CRM/support system

    // For now, just return success
    return new Response(JSON.stringify({
      success: true,
      message: 'Message envoyé avec succès'
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('Error handling contact form:', error);
    return new Response(JSON.stringify({
      error: 'Erreur serveur lors du traitement du formulaire'
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
