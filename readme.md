# Bulk Update Webflow CMS Items Multi Reference Fields

This project is a Node.js application designed to update CMS items Multi-Ref fields in a Webflow collection.
It fetches CMS items, checks for specific categories, and updates the items with new categories if necessary.

## Note

I Recommend saving a backup before running the script. So if something doesn't work as expected you can restore it.


## Features

- Fetches categories from a Webflow collection.
- Fetches CMS items in chunks to avoid memory issues.
- Checks and updates CMS items based on specified categories.
- Handles rate limiting and retries for API requests.

## Prerequisites

- Node.js (version 14 or higher)
- npm (version 6 or higher)

## Installation

1. Clone the repository: `git clone git@github.com:imshaiksaif/bulkUpdateWebflowCMSMultiRef.git`
2. Install the dependencies: `yarn install` or `npm install`
3. Run the script: `node src/handler.js` or `npm run start` or `yarn start`

## Configuration
Open the src/handler.js file.

Replace the placeholders with your actual Webflow API token and collection IDs:
this.API_TOKEN = 'YOUR_WEBFLOW_API_TOKEN'; // Replace with your API token
this.COLLECTION_ID = 'YOUR_BLOG_POST_COLLECTION_ID'; // Replace with your blog post collection ID
this.CATEGORIES_COLLECTION_ID = 'YOUR_CATEGORY_COLLECTION_ID'; // Replace with your categories collection ID

This will execute the script located at handler.js.

## How It Works
Fetch Categories: The script fetches categories from the specified Webflow collection and stores their IDs.
Fetch CMS Items: The script fetches CMS items in chunks of 100 to avoid memory issues.
Check and Update Items: For each CMS item, the script checks if it contains specific categories and updates the item with new categories if necessary.
Handle Rate Limiting: The script includes logic to handle rate limiting by waiting for a specified interval before retrying API requests.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.