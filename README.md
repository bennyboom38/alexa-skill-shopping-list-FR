# Alexa Shopping List Companion

This is an extensible Alexa Companion Skill (forked from https://github.com/paranerd/alexa-skill-shopping-list)
  - invocation name changed for "Panier Magique" to avoid to launch Alexa shopping list default skill
  - add feature to print shopping list on thermal printer with Home Assistant automation script

## Prerequisites

1. You will need an Amazon Developer account as well as an AWS account
1. Clone the repository
1. [Create AWS credentials](https://developer.amazon.com/de-DE/docs/alexa/smapi/manage-credentials-with-ask-cli.html#create-aws-credentials)

1. Install the Alexa Skill Kit
    ```
    npm i -g ask-cli
    ```
1. Configure the Alexa Skill Kit
    ```
    ask configure
    ```
    You will need to associate an AWS Profile with ASK CLI.
    When asked for access keys:
    1. Go to the IAM user list and click on the user you just created
    2. Click on the security credentials tab
    3. Scroll down to the access keys section and create a new key
    4. After finish, copy the access keys to ask cli

    If you have trouble getting it to work you can also try it by [using your main aws account](https://stackoverflow.com/a/37947853).


1. Set the correct region (i.e. region=eu-west-1)
    ```
    nano ~/.aws/credentials
    ```
1. Set up config

    Rename `lambda/.env.sample` to `lambda/.env`

    Fill in `lambda/.env`

    OR

    You may also set those in the AWS UI as "Environment Variables"
1. Update `skill.json`

    Rename `skill-package/skill.sample.json` to `skill.json`
1. Install dependencies

    ```
    cd lambda/
    ```

    ```
    npm i
    ```

## Configuration

- **API_URL**: URL to your backend API (E.g. for HA: https://your-public-ha.domain/api)

- **API_TOKEN**: API token to authenticate against the API

- **BACKEND**: The backend to connect to. Supported: 'hass' and 'todo'

## Deployment

### New skill

1. Run
    ```
    ask deploy
    ```

### Existing skill

1. Get the ARN of your lambda function and update `skill-package/skill.json`

    ```json
    "apis": {
      "custom": {}
    },
    ```

    to

    ```json
      "apis": {
        "custom": {
          "endpoint": {
            "uri": "arn:aws:lambda:..."
          }
        }
      },
    ```

1. Add the `/.ask/ask-states.json` you saved from your last deployment
1. Run
    ```
    ask deploy
    ```

## Debugging

```
ask dialog --locale de-DE
```

## Home Assistant Configuration

### Configure Thermal printer

#### Prerequisites

- I'm using Citizen CT-S310 connected by USB to RaspberryPi Zero W

#### Configure Raspberry Pi

1. Create python flask server script (copy print_server.py to /opt or other path but you need to adapt service file print_server.service)
1. From print_server.py replace <YOUR HOME ASSISTANT URL> by your Home Assistant URL (HTTPS needed)
1. From print_server.py replace <YOUR HOME ASSISTANT LONG-LIVE TOKEN> by your Home Assistant long live token
1. Create service file (copy script print_server.service to /etc/systemd/system/)
1. Reload Service list: systemctl daemon-reload
1. Enable Service: systemctl enable print_server.service
1. Start Service: systemctl start print_server.service
1. Try to join service by joining url : http://<ip of your raspberryPI>:5000/list
1. Try to print by joining url : http://<ip of your raspberryPI>:5000/print (you should get empty list if your home assistant shopping list is empty)

#### Configure Home Assistant Automation

1. Create Home Assistant REST command to call print url : 
```python
rest_command:
  print_shopping_list:
    url: "http://<your raspberryPI IP>:5000/print"
```
1. Create Home Assistant automation script to call REST command:
```python
alias: Imprimer la liste de courses
sequence:
  - action: rest_command.print_shopping_list
    data: {}
description: ""
icon: mdi:cloud-print
```
1. if you have changed script id "Imprimer la liste de courses" you need to change id also on lambda/index.js and then deploy again lambda with command ask deploy (please refer to "Existing skill" deployment process)
```javascript
      // Call Home Assistant API to print shopping list
      const entityId = 'script.imprimer_la_liste_de_courses'; // Replace by your Home Assistant script entity_id
```

### HowTo use the skill

1. Launch the skill : "Alexa, ouvre panier magique"
1. Add item : "ajoute café à ma liste"
1. Print the list : "imprime ma liste de courses"
1. Clean the list : "Vide ma liste"

## Backend support

- [Home Assistant Shopping List](https://www.home-assistant.io/integrations/shopping_list/)
- [Home Assistant RESTful Command](https://www.home-assistant.io/integrations/rest_command/)
- [To-Do-List](https://github.com/paranerd/to-do-list)

## Language support

- German (to change in locales from skill.json)
- French (by default)