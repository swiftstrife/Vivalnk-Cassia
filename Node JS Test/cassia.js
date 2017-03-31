function getData() {
  const username = 'vivalnk';
  const password = 'b8beb99eedf66dfb';
  const auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

  var jsonStream;
  var token;
  var request = require('request');
  var scannedDevices = [];
  var data;
  var deleteFlag = false;

  const CallBack = function(error, response, body) {
    body = JSON.parse(body);

    token = body.access_token;

    //Insert a call here
    mainMenu();
    
  };

  getToken(CallBack); // renew token

  function mainMenu(){
    scannedDevices = [];

    console.log("\n--- VIVALNK MAIN MENU ---");
    console.log("(1) Scan and connect device");
    console.log("(2) Display connected devices");
    console.log("(3) Disconnect device");

    promptUser();
  }

  function promptUser(){
    prompt('\nChoose action: ', function(input) {

      switch(parseInt(input)){
        case 1: 
            console.log("\nChoose from list of MAC IDs: ");
            scanForDevice();
            break;
        case 2: 
            console.log('\nConnected devices:');
            displayList();
            break;
        case 3: 
            console.log('\nConnected devices:');
            deleteFlag = true;
            displayList();          
            break;

      }
    });

  }

  function getToken(callBack) {
    request({
      method: 'POST',
      url: 'http://api.cassianetworks.com/oauth2/token',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth
      },
      body: "{  \"grant_type\": \"client_credentials\"}"
    }, callBack);

  }
  // ------- Display connected devices --------
  function displayList() {
    request({
      method: 'GET',
      url: 'http://api.cassianetworks.com/gap/nodes/' +
        '?connection_state=connected&mac=CC:1B:E0:E0:43:B4&access_token=' + token,
    }, function(error, response, body) {

      data = JSON.parse(body);

      for (var i = 0; i < data.nodes.length; i++)
      {
        console.log('(' + (i+1) +')', data.nodes[i].id);
      }


      if (deleteFlag == false)
      {
        mainMenu();
        return;
      }

      deleteFlag = false;
      chooseDeleteDevice();
    
      
    });
  }
  // ------- Scan for surrounding devices --------
  function scanForDevice() {
    var EventSource = require("eventsource");
    jsonStream = new EventSource('http://api.cassianetworks.com/' +
      'gap/nodes/?event=1&mac=CC:1B:E0:E0:43:B4&chip=0&access_token=' + token);

    //console.log("\n" + "List of device MAC IDs: ");


    jsonStream.onmessage = function(e) {
      try {
        var response = JSON.parse(e.data);

        if (scannedDevices.length == 0)
        {
          console.log("(0) Back to main menu");
        }

        if (!elementExists(scannedDevices, response.bdaddrs[0].bdaddr)) {
          scannedDevices.push(response.bdaddrs[0].bdaddr);

          console.log("(" + scannedDevices.length + ") " + response.bdaddrs[0].bdaddr);
        }


      } catch (err) {
        jsonStream.close();
        //chooseDevice();
      }

    }
    chooseDevice();
  };

  function chooseDevice() {
    prompt('\n', function(input) {
      try {
        jsonStream.close();
        connectDevice(scannedDevices[input-1].toString());
        console.log("\nConnecting " + scannedDevices[parseInt(input)-1] + "...");
    } catch (err) {
        mainMenu();
      }

    });
  }

  function chooseDeleteDevice() {
    prompt('\nChoose device to disconnect: ', function(input) {
      try {
        disconnectDevice(data.nodes[input-1].id.toString());
        console.log("\nDisconnecting " + data.nodes[input-1].id + "...");
    } catch (err) {
      console.log("error")
        mainMenu();
      }

    });

  }

  function elementExists(arr, needle) {
    return arr.indexOf(needle) > -1
  }

  // ------- Connect a device --------
  function connectDevice(deviceString) {
    request({
      method: 'POST',
      url: 'http://api.cassianetworks.com/gap/nodes/' + deviceString + 
      '/connection?mac=CC:1B:E0:E0:43:B4&chip=0&access_token=' + token,
      headers: {
        'Content-Type': 'application/json',
        'version': '1'
      },
      body: "{\"timeOut\": \"\",\"type\" :\"public\"}"
    }, function(error, response, body) {

      console.log('Response:', body);
      mainMenu();
    });
  }

  function disconnectDevice(deviceString) {
    request({
      method: 'DELETE',
      url: 'http://api.cassianetworks.com/gap/nodes/' + deviceString + 
      '/connection?mac=CC:1B:E0:E0:43:B4&chip=0&access_token=' + token,
      headers: {
        'Content-Type': 'application/json',
        'version': '1'
      },
      body: "{\"timeOut\": \"\",\"type\" :\"public\"}"
    }, function(error, response, body) {

      console.log('Response:', body);
      mainMenu();
    });

  }


  // ------- Prompt user input --------
  function prompt(promptString, cback) {
    var stdin = process.stdin,
      stdout = process.stdout;

    stdin.resume();
    stdout.write(promptString);

    stdin.once('data', function(data) {
      cback(data.toString().trim());
    });
  }

}

getData();
