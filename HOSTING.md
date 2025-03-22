# Hosting Guide for Mount Olympus Treasury

This guide provides instructions for hosting your Mount Olympus Treasury application online so your family can access it from any device.

## Option 1: Using Your Existing Domain (Recommended)

If you already have a domain, this is the most professional approach.

### Prerequisites
- Your registered domain name
- Access to your domain's DNS settings
- A web hosting account or service

### Steps

1. **Choose a Web Hosting Provider**
   - Recommended providers: Netlify, Vercel, GitHub Pages, or any traditional web host
   - For static sites like this one, many free options are available

2. **Upload Your Files**
   - Netlify/Vercel: Connect to your GitHub repository or drag-and-drop your files
   - Traditional hosting: Use FTP to upload all files from this project to your web host
   - GitHub Pages: Push your code to a GitHub repository and enable GitHub Pages

3. **Configure Your Domain**
   - In your hosting provider's dashboard, add your custom domain
   - Update your domain's DNS settings to point to your hosting provider:
     - For Netlify/Vercel: Add their nameservers or create a CNAME record
     - For traditional hosting: Update A records to point to your hosting IP address
     - For GitHub Pages: Create a CNAME record pointing to your GitHub Pages URL

4. **Enable HTTPS**
   - Most modern hosting providers offer free SSL certificates
   - Some providers (like Netlify, Vercel) enable this automatically
   - On traditional hosting, you may need to install a Let's Encrypt certificate

5. **Test Your Site**
   - After DNS propagation (may take 24-48 hours), visit your domain
   - Test all features work correctly
   - Test on different devices and browsers
   - Be sure to check the new login page (`login.html`) functions correctly

## Option 2: Free Hosting (Quick Setup)

If you don't want to use your domain or need a temporary solution:

### Using GitHub Pages

1. Create a GitHub account if you don't have one
2. Create a new repository
3. Upload all files from this project to your repository
4. Go to Settings > Pages
5. Select the main branch as the source
6. Your site will be published at `https://yourusername.github.io/repositoryname/`
7. Access the app by navigating to `https://yourusername.github.io/repositoryname/login.html`

### Using Netlify Drop

1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag and drop your entire project folder
3. Netlify will provide a random subdomain like `https://random-name-123456.netlify.app`
4. You can change the subdomain name in the site settings
5. Access the app by navigating to your Netlify subdomain + `/login.html`

## Option 3: Running on a Home Server

If you prefer to host within your home network:

1. Use a computer that can stay on consistently
2. Install a web server like Apache or Nginx
3. Configure the web server to serve your project files
4. For local network access only: Access via local IP (e.g., `http://192.168.1.100/login.html`)
5. For external access: Configure port forwarding on your router and use a dynamic DNS service

## UI Update Considerations

The application now features a modernized UI with a dedicated login page. When hosting, keep these points in mind:

- The entry point is now `login.html` rather than `index.html`
- CSS files include a new `tailwind.css` file that provides utility classes
- Make sure all files are uploaded, including any new images
- The app is now more responsive and should work well on all device sizes
- For the best experience, use a modern browser that supports CSS Grid and Flexbox

## Data Persistence Considerations

The Mount Olympus Treasury uses Firebase Firestore for data storage, which means:

- Data is stored in the cloud and can be accessed from any device
- All family members can use the same account from different devices
- Data is preserved even if browser data is cleared
- Each family has their own separate data space using a unique family code

### Setting Up Firebase for Your Family

1. **Create a Firebase Account**
   - Go to [firebase.google.com](https://firebase.google.com/) and sign in with a Google account
   - Click "Get Started" and create a new project (e.g., "Family-Bank")

2. **Set Up Firestore Database**
   - In the Firebase console, go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" for development (you can adjust security rules later)
   - Select a location closest to your family

3. **Register Your Web App**
   - In the Firebase console, click the gear icon (Project settings)
   - In the "Your apps" section, click the web icon (</>) to add a web app
   - Give your app a nickname (e.g., "Mount Olympus Treasury")
   - Register the app (no need to set up Firebase Hosting yet)
   
4. **Get Your Firebase Config**
   - After registering, you'll see the Firebase configuration object
   - Copy this configuration to `js/firebase-config.js` in your project
   - Replace the placeholder values with your actual Firebase config values

5. **Choose a Family Code**
   - After deploying your application, choose a unique family code
   - This code will be used to identify your family's data in Firebase
   - Share this code with family members so they can access the same data

### Cross-Device Synchronization

The app includes features to ensure consistent data across all family devices:

1. **Automatic Synchronization**
   - Changes made on one device automatically sync to Firebase
   - Other devices receive these updates in real-time when connected
   - No manual setup required beyond entering the same family code

2. **Force Cloud Sync Feature**
   - Found in the Settings tab (Parent/Zeus view)
   - Use this if different devices show inconsistent data
   - This button forces the current device to pull the latest data from Firebase
   - All family members should use the same family code for this to work

3. **Best Practices for Multi-Device Usage**
   - Always wait a few seconds after making changes before checking other devices
   - Ensure all devices have a stable internet connection
   - If data appears inconsistent, use the Force Cloud Sync button
   - Only one family member should make changes at a time when possible

### Troubleshooting Synchronization Issues

If family members report seeing different data across devices:

1. **First Steps**
   - Verify all devices are using the same family code
   - Check internet connectivity on all devices
   - Wait a few minutes for automatic synchronization

2. **Using Force Cloud Sync**
   - Log in as Zeus (parent) on the device with issues
   - Go to the Settings tab
   - Under Account Management, click "Force Cloud Sync"
   - This will pull the latest data from Firebase to that device

3. **Common Issues and Solutions**
   - **Issue**: New transactions don't appear on other devices
     **Solution**: Use Force Cloud Sync, or wait a few minutes for auto-sync

   - **Issue**: Balance amounts differ across devices
     **Solution**: Use Force Cloud Sync on all devices to ensure consistency

   - **Issue**: Changes made offline not appearing
     **Solution**: Connect to the internet and use Force Cloud Sync

   - **Issue**: Synchronization conflicts
     **Solution**: The most recently saved data usually takes precedence; use Force Cloud Sync to resolve

   - **Issue**: Login page not redirecting properly
     **Solution**: Make sure cookies and localStorage are enabled in your browser

### Security Considerations

1. Since the application now uses cloud storage, consider the following:
   - Choose a strong, unique family code that is difficult to guess
   - Update the parent password from the default
   - Do not store real banking information in the application
   - For production use, you may want to update Firebase security rules

2. In a future version, you could enhance security with:
   - Email/password authentication
   - Two-factor authentication
   - More robust security rules

### Potential Improvements:

1. **Enhance Firebase Integration**
   - Implement proper user authentication
   - Further improve real-time data synchronization
   - Create multiple user accounts with different permission levels

2. **Data Management**
   - Add data backup/export functionality
   - Implement more sophisticated conflict resolution for multi-device usage
   - Add version history for transactions
   - Add a synchronization status indicator

## Need Help?

If you need assistance with hosting or synchronization issues, consider:

1. Hiring a freelance web developer for a few hours
2. Using a website builder service with hosting included
3. Posting specific questions on Stack Overflow or web hosting forums
4. Checking the browser console (F12) for any Firebase-related error messages 