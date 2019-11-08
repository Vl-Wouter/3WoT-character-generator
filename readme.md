# Character generator

A simple Web Application built with the basics: HTML, CSS and Vanilla JS. The app allows a logged in user to create a character based on the 8x8 grid of a Raspberry Pi Sense Hat LED Matrix. The user has the option to either create on realtime (by clicking on the squares in the editor), or simply click a button to have one randomly generated.

All saved avatars are pushed to a Firestore database and can be displayed in the editor or on the Pi via the included Python app.

**Note:** If you clone this repository you might have to change the firebase details and add a service account file to the `/pi` folder. The details included are only to run a demo on Github Pages.

## Contributors

Wouter Vlaeyen - [GitHub](https://github.com/Vl-Wouter) - [Website](https://www.wouterv.be)