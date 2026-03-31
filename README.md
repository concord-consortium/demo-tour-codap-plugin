# Demo Tour CODAP Plugin

# Development

## Getting Started
1. Clone this repository and `cd` into the new folder.
2. Install the dependencies `npm install`.
3. Run the development server `npm start`.
4. Open [localhost:8080](http://localhost:8080) (or use port 8081 if you are already using 8080). You should see a basic plugin with a heading of "Demo Tour CODAP Plugin".

   It's ok if you see an error like `handleResponse: CODAP request timed out: [{"action":"update","resource":"interactiveFrame","values":{"name":"Sample Plugin","version":"0.0.1","dimensions":{"width":380,"height":680}}},{"action":"get","resource":"interactiveFrame"}]`. This just means that the plugin is running outside of CODAP, so is not receiving responses to API requests, which is expected.

## Testing

### Jest Tests
The project uses Jest for unit testing. To run the tests:
```
npm test
```

### Testing in CODAP

There are two ways to test the plugin in CODAP:
- running it locally on https and use the deployed CODAP
- running it and CODAP locally on http

#### HTTPS
1. Start the plugin with `npm run start:secure`. You need to first setup a local http certificate if you haven't done so: https://github.com/concord-consortium/codap/blob/main/v3/README.md#run-using-https
2. Run CODAP v2 or v3 with the `di` parameter:
    - v2: https://codap.concord.org/app/?di=https://localhost:8080/
    - v3: https://codap3.concord.org/?di=https://localhost:8080/

#### HTTP
1. Start plugin webserver `npm start` (it will be on 8080 by default)
2. Setup a local webserver running CODAP.
    - v2: Download the latest `build_[...].zip` file https://codap.concord.org/releases/zips/. Extract the zip to a folder and run it with a local webserver. For example `npx httpserver -p 8081`
    - v3: Checkout the v3 source, install the dependencies, and start the dev server: https://github.com/concord-consortium/codap/blob/main/v3/README.md#initial-steps. The dev server should automatically choose the next avaiable port which would normally be 8081
3. Open CODAP with the plugin embedded in it: http://localhost:8081/static/dg/en/cert/index.html?di=http://localhost:8080

For further information on [CODAP Data Interactive Plugin API](https://github.com/concord-consortium/codap/wiki/CODAP-Data-Interactive-Plugin-API).
