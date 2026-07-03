const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const connectDB = require('./config/database');
const LegalPolicy = require('./models/LegalPolicy');
const User = require('./models/User');

connectDB();

const privacyPolicyContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Privacy Policy - SiteLink</title>
</head>
<body>

<h1>Privacy Policy</h1>
<p><strong>Last Updated: January 2024</strong></p>

<h2>1. Introduction</h2>
<p>
  SiteLink ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, a construction industry networking and job marketplace application.
</p>

<h2>2. Information We Collect</h2>

<h3>2.1 Information You Provide Directly</h3>
<ul>
  <li><strong>Account Registration:</strong> Name, email address, phone number, professional qualifications, work experience</li>
  <li><strong>Profile Information:</strong> Skills, certifications, portfolio, photos, location, work history</li>
  <li><strong>Job Applications:</strong> When you apply for jobs, we collect your application information</li>
  <li><strong>Communications:</strong> Messages, comments, and posts on our platform</li>
  <li><strong>Payment Information:</strong> Credit card and banking details (processed securely through third-party providers)</li>
</ul>

<h3>2.2 Information Collected Automatically</h3>
<ul>
  <li>Device information (IP address, browser type, operating system)</li>
  <li>Usage data (pages visited, links clicked, time spent on platform)</li>
  <li>Location data (if permission granted)</li>
  <li>Cookies and similar tracking technologies</li>
  <li>Firebase Cloud Messaging tokens for push notifications</li>
</ul>

<h3>2.3 Third-Party Information</h3>
<ul>
  <li>Information from Google Login integration</li>
  <li>Data from background verification services (with your consent)</li>
  <li>Information from employers or colleagues you reference</li>
</ul>

<h2>3. How We Use Your Information</h2>
<p>We use collected information for:</p>
<ul>
  <li>Creating and maintaining your account</li>
  <li>Matching you with relevant job opportunities</li>
  <li>Facilitating connections with other construction professionals</li>
  <li>Sending push notifications and updates</li>
  <li>Improving platform features and user experience</li>
  <li>Verifying identity and preventing fraud</li>
  <li>Complying with legal obligations</li>
  <li>Marketing and promotional purposes (with consent)</li>
  <li>Analytics and performance monitoring</li>
</ul>

<h2>4. Data Sharing and Disclosure</h2>

<h3>4.1 Information We Share</h3>
<p>We may share your information with:</p>
<ul>
  <li><strong>Employers/Job Posters:</strong> Your profile and application information when you apply</li>
  <li><strong>Service Providers:</strong> Third-party vendors for payment processing, hosting, analytics</li>
  <li><strong>Legal Requirements:</strong> Government agencies if required by law</li>
  <li><strong>Business Partners:</strong> With your explicit consent</li>
</ul>

<h3>4.2 Information We Do NOT Share</h3>
<p>We do NOT sell your personal information to third parties for commercial purposes without your explicit consent.</p>

<h2>5. Data Retention</h2>
<p>
  We retain your personal information for as long as necessary to provide our services. You can request deletion of your account and associated data at any time. We retain certain information for legal compliance purposes for up to 2 years after account deletion.
</p>

<h2>6. Security</h2>
<p>
  We implement industry-standard security measures including:
</p>
<ul>
  <li>SSL/TLS encryption for data in transit</li>
  <li>Password hashing and salting</li>
  <li>Role-based access control</li>
  <li>Regular security audits</li>
  <li>Secure data centers</li>
</ul>
<p>
  However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
</p>

<h2>7. Your Rights</h2>
<p>Depending on your location, you may have the right to:</p>
<ul>
  <li>Access your personal information</li>
  <li>Correct inaccurate information</li>
  <li>Request deletion of your data</li>
  <li>Opt-out of marketing communications</li>
  <li>Port your data to another service</li>
  <li>Object to certain processing activities</li>
</ul>

<h2>8. Cookies and Tracking</h2>
<p>
  We use cookies to enhance your experience. You can control cookie settings through your browser. Disabling cookies may limit platform functionality.
</p>

<h2>9. Push Notifications</h2>
<p>
  We send push notifications for job opportunities, messages, and platform updates. You can disable notifications in your device settings or through your account preferences.
</p>

<h2>10. Third-Party Links</h2>
<p>
  Our platform may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing information.
</p>

<h2>11. Children's Privacy</h2>
<p>
  SiteLink is not intended for users under 18 years old. We do not knowingly collect information from children. If we discover such information, we will delete it immediately.
</p>

<h2>12. International Data Transfers</h2>
<p>
  Your information may be transferred to, stored in, and processed in countries other than your country of residence. These countries may not have data protection laws as comprehensive as your home country.
</p>

<h2>13. Changes to This Policy</h2>
<p>
  We may update this Privacy Policy periodically. Changes become effective upon posting. Your continued use of the platform constitutes acceptance of updated terms.
</p>

<h2>14. Contact Us</h2>
<p>
  If you have questions about this Privacy Policy or our data practices, please contact:
</p>
<ul>
  <li>Email: privacy@sitelink.com</li>
  <li>Address: SiteLink, Construction Hub, India</li>
  <li>Phone: +91-XXX-XXX-XXXX</li>
</ul>

<p><strong>Effective Date: January 1, 2024</strong></p>

</body>
</html>
`;

const termsAndConditionsContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Terms and Conditions - SiteLink</title>
</head>
<body>

<h1>Terms and Conditions</h1>
<p><strong>Last Updated: January 2024</strong></p>

<h2>1. Agreement to Terms</h2>
<p>
  By accessing and using SiteLink, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
</p>

<h2>2. Use License</h2>
<p>
  Permission is granted to temporarily download one copy of the materials (information or software) on SiteLink for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
</p>
<ul>
  <li>Modifying or copying the materials</li>
  <li>Using the materials for any commercial purpose or for any public display</li>
  <li>Attempting to decompile or reverse engineer any software contained on SiteLink</li>
  <li>Removing any copyright or other proprietary notations from the materials</li>
  <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
  <li>Violating any applicable laws or regulations</li>
  <li>Accessing or searching the site by any means other than SiteLink's publicly supported interfaces</li>
</ul>

<h2>3. Disclaimer</h2>
<p>
  The materials on SiteLink are provided on an 'as is' basis. SiteLink makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
</p>

<h2>4. Limitations</h2>
<p>
  In no event shall SiteLink or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on SiteLink, even if SiteLink or a SiteLink authorized representative has been notified orally or in writing of the possibility of such damage.
</p>

<h2>5. Accuracy of Materials</h2>
<p>
  The materials appearing on SiteLink could include technical, typographical, or photographic errors. SiteLink does not warrant that any of the materials on SiteLink are accurate, complete, or current. SiteLink may make changes to the materials contained on SiteLink at any time without notice.
</p>

<h2>6. User Responsibilities</h2>
<ul>
  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
  <li>You are responsible for all activities that occur under your account</li>
  <li>You agree to notify SiteLink immediately of any unauthorized use of your account</li>
  <li>You agree not to engage in any activity that interferes with or disrupts the platform</li>
  <li>You agree to provide accurate and truthful information in your profile</li>
</ul>

<h2>7. Prohibited Conduct</h2>
<p>You agree NOT to:</p>
<ul>
  <li>Harass, abuse, or threaten other users</li>
  <li>Post discriminatory, defamatory, or offensive content</li>
  <li>Engage in fraudulent or deceptive practices</li>
  <li>Attempt to gain unauthorized access to platform systems</li>
  <li>Post spam, viruses, or malicious code</li>
  <li>Violate intellectual property rights</li>
  <li>Create fake profiles or impersonate others</li>
  <li>Engage in any illegal activity</li>
  <li>Scrape or collect data without authorization</li>
  <li>Post explicit, pornographic, or violent content</li>
</ul>

<h2>8. Intellectual Property Rights</h2>
<p>
  All content on SiteLink, including text, graphics, logos, images, and software, is the property of SiteLink or its content suppliers and is protected by international copyright laws. You may not reproduce, redistribute, or transmit any content without permission.
</p>

<h2>9. User-Generated Content</h2>
<ul>
  <li>You retain ownership of content you create and post on SiteLink</li>
  <li>By posting content, you grant SiteLink a non-exclusive, royalty-free license to use, reproduce, and distribute it</li>
  <li>You are responsible for ensuring your content does not violate third-party rights</li>
  <li>SiteLink may remove content that violates these terms</li>
</ul>

<h2>10. Limitation of Liability</h2>
<p>
  In no case shall SiteLink, its owners, employees, or suppliers be liable for any damages (including, without limitation, lost revenue, lost profits, lost data, or consequential damages) even if SiteLink has been advised of the possibility of such damages arising from your use of or inability to use SiteLink or any information provided therein.
</p>

<h2>11. Termination of Service</h2>
<p>
  SiteLink reserves the right to terminate user accounts and access to the platform for:
</p>
<ul>
  <li>Violation of these Terms and Conditions</li>
  <li>Illegal activity or suspected fraud</li>
  <li>Abusive behavior toward other users</li>
  <li>Non-payment of fees (if applicable)</li>
  <li>Other violations at SiteLink's sole discretion</li>
</ul>

<h2>12. Payment Terms</h2>
<ul>
  <li>Job posting and premium features require payment</li>
  <li>All prices are in Indian Rupees unless otherwise stated</li>
  <li>Payment processing is handled by authorized third-party providers</li>
  <li>Refunds are subject to our Refund Policy</li>
  <li>SiteLink may change pricing with 30 days notice</li>
</ul>

<h2>13. Dispute Resolution</h2>
<p>
  Any disputes between users or disputes between users and SiteLink shall be resolved through:
</p>
<ul>
  <li>Negotiation and mutual agreement</li>
  <li>Mediation</li>
  <li>Arbitration according to applicable laws</li>
</ul>

<h2>14. Governing Law</h2>
<p>
  These Terms and Conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts located in India.
</p>

<h2>15. Indemnification</h2>
<p>
  You agree to indemnify and hold harmless SiteLink, its officers, directors, employees, and agents from any claim, demand, or damage incurred as a result of your use of SiteLink or violation of these Terms and Conditions.
</p>

<h2>16. Third-Party Services</h2>
<p>
  SiteLink may include services provided by third parties (Google login, payment processors, etc.). Your use of these services is subject to their terms. SiteLink is not responsible for third-party services or their conduct.
</p>

<h2>17. Modifications to Terms</h2>
<p>
  SiteLink reserves the right to modify these Terms and Conditions at any time. Continued use of the platform after modifications constitutes acceptance of the new terms.
</p>

<h2>18. Severability</h2>
<p>
  If any provision of these Terms and Conditions is found to be unenforceable, that provision shall be limited or eliminated to the minimum extent necessary so that the remaining provisions will continue in full force and effect.
</p>

<h2>19. Contact Information</h2>
<p>
  For questions about these Terms and Conditions, please contact:
</p>
<ul>
  <li>Email: support@sitelink.com</li>
  <li>Address: SiteLink, Construction Hub, India</li>
  <li>Phone: +91-XXX-XXX-XXXX</li>
</ul>

<p><strong>Effective Date: January 1, 2024</strong></p>

</body>
</html>
`;

async function seedPolicies() {
  try {
    console.log('🌱 Starting to seed legal policies...');

    // Find or create an admin user
    let adminUser = await User.findOne({ email: 'admin@sitelink.com' });
    if (!adminUser) {
      console.log('📝 Creating admin user...');
      adminUser = await User.create({
        name: 'SiteLink Admin',
        email: 'admin@sitelink.com',
        phone: '9999999999',
        password: 'admin123', // This should be hashed in production
      });
    }

    const adminId = adminUser._id;

    // Clear existing policies
    await LegalPolicy.deleteMany({});
    console.log('🗑️  Cleared existing policies');

    // Create Privacy Policy
    const privacyPolicy = await LegalPolicy.create({
      policyType: 'PRIVACY_POLICY',
      title: 'Privacy Policy - SiteLink',
      content: privacyPolicyContent,
      version: 1,
      isActive: true,
      effectiveDate: new Date('2024-01-01'),
      createdBy: adminId,
      lastUpdatedBy: adminId,
      changelog: 'Initial version',
      summary:
        'How SiteLink collects, uses, and protects your personal information and data.',
    });
    console.log('✅ Privacy Policy created:', privacyPolicy._id);

    // Create Terms and Conditions
    const termsAndConditions = await LegalPolicy.create({
      policyType: 'TERMS_AND_CONDITIONS',
      title: 'Terms and Conditions - SiteLink',
      content: termsAndConditionsContent,
      version: 1,
      isActive: true,
      effectiveDate: new Date('2024-01-01'),
      createdBy: adminId,
      lastUpdatedBy: adminId,
      changelog: 'Initial version',
      summary:
        'Terms governing your use of the SiteLink platform and services.',
    });
    console.log('✅ Terms and Conditions created:', termsAndConditions._id);

    console.log('\n✨ Seeding completed successfully!');
    console.log('\n📋 Created Policies:');
    console.log('1. Privacy Policy (v1)');
    console.log('2. Terms and Conditions (v1)');

    console.log('\n🔗 Test these endpoints:');
    console.log(
      '   GET  /api/legal/policies/PRIVACY_POLICY (get current policy)'
    );
    console.log(
      '   GET  /api/legal/policies/TERMS_AND_CONDITIONS (get current policy)'
    );
    console.log(
      '   GET  /api/legal/policies/PRIVACY_POLICY/versions (all versions)'
    );

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding policies:', error.message);
    process.exit(1);
  }
}

seedPolicies();
