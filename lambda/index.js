const Alexa = require('ask-sdk-core');
require('dotenv').config();

let api;
const maxNoOfItemsReported = 5;

if (process.env.BACKEND === 'hass') {
  const HomeAssistant = require('./backends/home-assistant');
  api = new HomeAssistant();
} else {
  const ToDoList = require('./backends/to-do-list');
  api = new ToDoList();
}

let wasOpened = false;

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest'
    );
  },
  handle(handlerInput) {
    wasOpened = true;
    const speakOutput = 'Voici votre liste de courses, que souhaitez-vous faire ?';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const AddItemIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AddItemIntent'
    );
  },
  async handle(handlerInput) {
    // Response container
    let speakOutput;

    // Get item name from request
    let item = Alexa.getSlotValue(handlerInput.requestEnvelope, 'item');
    item = item.charAt(0).toUpperCase() + item.slice(1); // Make first letter uppercase

    try {
      // Add item to list
      await api.create(item);
      speakOutput = `J'ai ajouté ${item}.`;
      speakOutput += wasOpened ? 'Autre chose?' : '';
    } catch (err) {
      speakOutput = 'Désolé, quelque chose s\'est mal passé';
      console.error('Error adding item');
      console.error(err);
    }

    // Prepare response builder
    let rb = handlerInput.responseBuilder.speak(speakOutput);

    // Ask for more if opened
    if (wasOpened) {
      rb = rb.reprompt('Autre chose?');
    }

    return rb.getResponse();
  },
};

const ListItemsIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'ListItemsIntent'
    );
  },
  async handle(handlerInput) {
    // Fallback response
    let speakOutput;

    try {
      // Get all items
      const items = await api.list();
      const totalItemsAmount = items.length;

      const itemsToReportAmount =
          totalItemsAmount < maxNoOfItemsReported
              ? totalItemsAmount : maxNoOfItemsReported;
      const itemsToReport = items.slice(0, itemsToReportAmount).map((item) => item.name);

      // Output
      if (totalItemsAmount === 0) {
        // List is empty
        speakOutput = `La liste de courses est vide`;
      } else if (totalItemsAmount === 1) {
        // List has one item
        speakOutput = `Il y a un article sur ta liste: ${itemsToReport[0]}`;
      } else {
        const itemsListed = itemsToReport.slice(0, -1).join(', ') + ' et ' + itemsToReport.slice(-1);
        if (totalItemsAmount <= maxNoOfItemsReported) {
          // List all items on the list (amount below maxNoOfItemsReported)
          speakOutput = `Il y a ${totalItemsAmount} articles sur ta liste: ${itemsListed}`;
        } else {
          // More items than maxNoOfItemsReported are on the list. Change text and only list the last x ones.
          speakOutput = `Il y a ${totalItemsAmount} articles sur ta liste. Les derniers ${itemsToReportAmount} sont: ${itemsListed}`;
        }
      }
      
    } catch (err) {
      speakOutput = 'Désolé, quelque chose a mal tourné';
      console.error(err);
    }

    let rb = handlerInput.responseBuilder.speak(speakOutput);

    // Ask for more if opened
    if (wasOpened) {
      rb = rb.reprompt('Autre chose?');
    }

    return rb.getResponse();
  },
};

const PrintItemsIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'PrintItemsIntent'
    );
  },
  async handle(handlerInput) {
    // Response container
    let speakOutput;

    try {
      // Call Home Assistant API to print shopping list
      const entityId = 'script.imprimer_la_liste_de_courses'; // Replace by your Home Assistant script entity_id
      await api.print(entityId);
      speakOutput = 'J\'imprime votre liste de courses maintenant.';
    } catch (err) {
      speakOutput = 'Désolé, je n\'ai pas pu imprimer votre liste.';
      console.error('Error printing shopping list', err);
    }

    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};

const ClearCompletedItemsIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        'ClearCompletedItemsIntent'
    );
  },
  async handle(handlerInput) {
    // Response container
    let speakOutput;

    try {
      // Add item to list
      await api.clear();
      speakOutput = 'Liste nettoyée';
    } catch (err) {
      speakOutput = 'Désolé, quelque chose a mal tourné';
      console.error('Error clearing list');
      console.error(err);
    }

    // Prepare response builder
    let rb = handlerInput.responseBuilder.speak(speakOutput);

    // Ask for more if opened
    if (wasOpened) {
      rb = rb.reprompt('Autre chose?');
    }

    return rb.getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent'
    );
  },
  handle(handlerInput) {
    const speakOutput =
      'Malheureusement, je ne peux pas vous aider pour le moment. Je suis désolé.';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        'AMAZON.CancelIntent' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          'AMAZON.StopIntent' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent')
    );
  },
  handle(handlerInput) {
    const speakOutput = 'À bientôt!';
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      'SessionEndedRequest'
    );
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    wasOpened = false;
    return handlerInput.responseBuilder.getResponse();
  },
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
    );
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return (
      handlerInput.responseBuilder
        .speak(speakOutput)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse()
    );
  },
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error(`~~~~ Error handled: ${error.stack}`);
    const speakOutput = `Désolé, j'ai eu du mal à faire ce que vous m'avez demandé. Veuillez réessayer.`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    AddItemIntentHandler,
    ListItemsIntentHandler,
    ClearCompletedItemsIntentHandler,
    PrintItemsIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
