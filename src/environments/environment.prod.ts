export const environment = {
  production: true,
  project: 'main',
  name: function(project: string) {
    let names = {
      "main": "Acqua Perfetta Pandan",
      "pandan": "Acqua Perfetta",
      "anunas": "Acqua Perfetta Anunas"
    };

    return names[project];
  },
  config: function(project: string) {
    let configs = {
      "main": {
        apiKey: "AIzaSyCmfsUeKSR5CwJItufGVN0cVnggct-84-Y",
        authDomain: "acqua-perfetta.firebaseapp.com",
        databaseURL: "https://acqua-perfetta.firebaseio.com",
        projectId: "acqua-perfetta",
        storageBucket: "acqua-perfetta.appspot.com",
        messagingSenderId: "131375727911",
        appId: "1:131375727911:web:6c758564af2b96144fd502"
      },
      "pandan": {
        apiKey: "AIzaSyAUamAk3v4TdR_WLV05qKZhlRdlwnTXhgE",
        authDomain: "acqua-perfetta-pandan.firebaseapp.com",
        databaseURL: "https://acqua-perfetta-pandan.firebaseio.com",
        projectId: "acqua-perfetta-pandan",
        storageBucket: "acqua-perfetta-pandan.appspot.com",
        messagingSenderId: "526907882397",
        appId: "1:526907882397:web:2d234779fc1193c8310d74"
      },
      "anunas": {
        apiKey: "AIzaSyDp7WtSlGVc3GLGLyAiETFtINSxmS2C2Ko",
        authDomain: "acqua-perfetta-anunas.firebaseapp.com",
        databaseURL: "https://acqua-perfetta-anunas.firebaseio.com",
        projectId: "acqua-perfetta-anunas",
        storageBucket: "acqua-perfetta-anunas.appspot.com",
        messagingSenderId: "149589499779",
        appId: "1:149589499779:web:1d345e42d1b80684f4a0b6"
      }
    };

    return configs[project];
  }
};
