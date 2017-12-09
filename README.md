**Running the Extension and the Server**

If you&#39;re having any trouble contact either Seva (vvl2@case.edu) or Jon (jkl77@case.edu)

**Setting up the Server and Database:**

1. &quot;npm install&quot; all node modules ( **if you don&#39;t have node or node project manager, then install node and then npm** )
2. Clone the server from the project repo here: [https://github.com/JonathanLigh/RRE](https://github.com/JonathanLigh/RRE)
3. From the command line, navigate into the project and run &quot;npm start&quot; to build the server, then terminate the process.
4. Populate the database:
  1. If you don&#39;t have mongoDB installed and running:
    1. Install mongodb here: [https://docs.mongodb.com/getting-started/shell/installation/](https://docs.mongodb.com/getting-started/shell/installation/)
    2. Run &quot;mongod&quot; in a separate terminal window and leave it running for the rest of using this project (You could also configure mongodb to run as a background process on startup, but that&#39;s extra work)
  2. In a terminal window set the current working directory to the RRE project folder
  3. Next you will have to run the crawler. **It takes many hours for it to parse enough subreddits such that the recommendations will be reasonable. Therefore, it is best run overnight.**
  4. Run the crawler by trying &quot;node ./server/crawler/crawler.js crawl 10&quot; ( **If you have hours to populate the database, then run with 100 instead of 10. This value is the batch size of each query** ).
    1. If running on linux and the above command does not correctly execute the crawler process, try starting it with

&quot;nodejs ./server/crawler/crawler.js crawl 10&quot;

1.
  1. You can check the amount of entries in the mongoDB by opening another terminal window, opening the mongo interface, running &quot;use RREdb&quot;, and running &quot;db.subreddits.count()&quot;.
  2. Terminate the crawler process by sending a Ctrl C kill signal in the terminal running the crawler process after a sufficient amount of subreddits have been parsed. (**4000 subreddits takes about (5-20) hours and is a sufficient quantity to at least get half decent recommendations**).
2. Run &quot;npm start&quot; and move to the next section.

**Building the Front End:**

1. Clone the front end project from this repo: [https://github.com/Crazychicken563/RRE-ChromeExtension](https://github.com/Crazychicken563/RRE-ChromeExtension)
2. Run &quot;npm install&quot;
3. Run &quot;npm start&quot; to build the project into the &quot;./build: folder
4. Open Chrome or Chromium. This extension will NOT work in any other browser.
5. Open the extensions management view through either the chrome settings menu or navigating to &quot;chrome://extensions/&quot; in the search bar.
6. Install the extension. Because it is not uploaded to the chrome store, you must install it locally from the file system.
  1. Check the **Developer mode** checkbox
  2. Press load unpacked extensions
  3. Select the dev folder inside of RRE-ChromeExtension/build/
7. Using the extension:
  1. Navigate your browser to reddit.
  2. The extension will automatically open a first time setup view.

**First Time Setup/General Use:**

1. First Time Setup:
  1. The slider adjusts how many tags you have to work with vs how relevant they are. These tags are selected based on your current subscriptions. After First time setup is closed the slider will not appear again.
2. Settings:
  1. Max Recommendations:
    1. This regulates how many recommendations are are displayed at once on the extension interface.
    2. The value can be modified by typing in the textbox and pressing enter to save. The value will not be saved if enter is not pressed.
  2. Tag Dropdown:
    1. Add new tags by clicking from the list of tags in the dropdown. You cannot have duplicate tags and will be notified if attempting to add a duplicate.
  3. Tag List:
    1. Remove tags from the list by clicking the x button on their right side. Tags can be added back by selecting them from the dropdown above the list.
  4. Blacklist Input:
    1. You can manually add an entry to the blacklist by tying in the name of the subreddit into the textbox. The &quot;/r/&quot; and &quot;/&quot; are automatically appended to the beginning and end of the name respectively so don&#39;t bother adding those. Press enter to add to the blacklist.
  5. Blacklist:
    1. Remove blacklisted subreddits from the list by clicking the x button on their right side.
3. Exit the settings window to begin the receiving recommendations.
4. Main UI:
  1. Navigating to a recommended subreddit:
    1. Simply click the blue link in the list recommendations to navigate to that subreddit.
  2. Remove a recommendation
    1. If you aren&#39;t interested in the recommendation, click the x next to it and it will be added to the blacklist and removed from the recommendations.
  3. Accessing Settings:
    1. Click the setting button in the top right of the UI to reopen the settings view. Instructions for settings are above.
5. We hope you enjoy using our extension! May your recommendations be relevant and your load time low.

**Running Tests**

1. For either repository, navigate to the root folder of the project in a terminal window and run npm test to execute all the tests with code coverage output.
