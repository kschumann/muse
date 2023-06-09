var maxTokens = 2048;//max 2048
var temperature = 1; //0 to 2 higher values more random
var frequencyPenalty = 0.5; //-2 to 2
var presencePenalty = 0.5; //-2 to 2


function setUserProps(token,model){
  PropertiesService.getUserProperties().setProperties({"token":token,"model":model});
}

function getProperties(){
  let counter = 0;
  let messageProps = PropertiesService.getDocumentProperties().getProperties();
  for (key in messageProps){
    counter = counter + 1;
  }
  let userProps = PropertiesService.getUserProperties().getProperties();  
  const token = userProps["token"];
  const model = userProps["model"];
  return [token,model,counter];
}

function cleanseInput(input){
  if(input){
    return input.replace(/['"\n\r]+/g,'');
    } else{
    return "";
  }
  }

function addThreadToDoc(){
  let convo = [];
  let messageProps = PropertiesService.getDocumentProperties().getProperties();
  for (key in messageProps){
   let item = JSON.parse(messageProps[key]);
   convo.push(item["content"])
  }
  //convo.reverse();
 convo.forEach(item => insertResponse(item + "\r"));
}

/**Ask questions in Chat format**/
function askQuestion(){
  const prompt = "How old am I?"
  getChatCompletion(prompt);
}

function getChatCompletion(context,prompt) {
  try{
    const variables = getProperties();
    const token = variables[0];
    const model = variables[1];
    prompt = cleanseInput(prompt);
    let counter = 0;
    const url = 'https://api.openai.com/v1/chat/completions';
    const data ={
        "model": model,
        "max_tokens":maxTokens,
        "temperature":temperature,
        "frequency_penalty":frequencyPenalty,
        "presence_penalty":presencePenalty,
        "messages": [
          {"role": "system", "content": context}
        ],
      }

    let messageProps = PropertiesService.getDocumentProperties().getProperties();
    for (key in messageProps){
      data["messages"].push(JSON.parse(messageProps[key]));
      counter = counter + 1;
    }
    
    PropertiesService.getDocumentProperties().setProperty(counter,'{"role": "user", "content":"' +  prompt + '"}');

    data["messages"].push({"role": "user", "content": prompt});
    console.log(data);
    const params = {
      'method':'post',
      'contentType':'application/json',
      'headers':{Authorization:"Bearer " + token},
      'payload' : JSON.stringify(data), 
      'muteHttpExceptions':false
    };
    const response = UrlFetchApp.fetch(url, params);
    let responseObj = JSON.parse(response.getContentText());
    counter = counter + 1;
    let responseProperty = '{"role":"assistant","content":"' + cleanseInput(responseObj["choices"][0]["message"]["content"]) + '"}';
    PropertiesService.getDocumentProperties().setProperty(counter,responseProperty);  
    return responseObj["choices"][0]["message"]["content"];
  } catch(e){
    return "Error encountered in processing your request.  Error message: " + e;
  }
}

function insertResponse(response){
  let doc = DocumentApp.getActiveDocument();
  // let cursor = doc.getCursor();
  // if (cursor) {
  //   cursor.insertText(response);
  // } else {
    doc.getBody().appendParagraph(response);
  // }
}

function deleteProperties(){
  PropertiesService.getDocumentProperties().deleteAllProperties();
}

function onOpen() {
  DocumentApp.getUi().createMenu("Muse")
    .addItem('Open', 'showSidebar')
    .addToUi();

  // const customShortcut = 'Ctrl+Shift+Alt+M';
  // DocumentApp.getUi() 
  //   .createAddonMenu()
  //   .addItem('Start a Conversation', 'showSidebar')
  //   .addToUi()
  //   .setAccelerator(DocumentApp.getUi().newTrigger('showSidebar').forKey(customShortcut).create());
}


function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setWidth(1200)
      .setTitle('Your Muse');
  DocumentApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
      .showSidebar(html);
}
