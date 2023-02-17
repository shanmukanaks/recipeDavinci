import { withAuthenticator } from "aws-amplify-react-native";

import React, { useState, useEffect, useRef } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Image } from "react-native";
import Constants from "expo-constants";
import { Camera, CameraType } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { MaterialIcons } from "@expo/vector-icons";
import Button from "./src/Button";
import { Amplify, Storage } from "aws-amplify";
import config from "./src/aws-exports";
import mime from "mime-types";

Amplify.configure({
  ...config,
  Analytics: {
    disabled: true,
  },
});

// Storage.configure({ region: "us-west-2" });

function App() {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [image, setImage] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);
  const cameraRef = useRef(null);
  const [posArr, setPosArr] = useState([]);
  const [guessInc, setGuessInc] = useState(0);
  const [ingredients, setIngredients] = useState([]);
  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    (async () => {
      MediaLibrary.requestPermissionsAsync();
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === "granted");
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const data = await cameraRef.current.takePictureAsync();
        console.log(data);
        setImage(data.uri);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const savePicture = async () => {
    if (image) {
      try {
        const asset = await MediaLibrary.createAssetAsync(image);
        alert("Picture saved! 🎉");
        setImage(null);
        console.log("saved successfully");
      } catch (error) {
        console.log(error);
      }
    }
  };

  const storePicture = async () => {
    const imageName = image.replace(/^.*[\\\/]/, "");
    const fileType = mime.lookup(image);
    const access = { level: "public", contentType: "image/jpeg" };
    const imageData = await fetch(image);
    const blobData = await imageData.blob();

    try {
      await Storage.put(imageName, blobData, access);
    } catch (err) {
      console.log("error1: ", err);
    }
    // try {
    //   await Storage.put(imageName, image, access);
    // } catch (err) {
    //   console.log("error2: ", err);
    // }

    const imageKey = "public/" + imageName;
    console.log("key: ", imageKey);

    try {
      const signedURL = await Storage.get(imageName, access);
      console.log("signedURL: ", signedURL);

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "text/plain");

      const raw = '{\n  "url": "' + signedURL + '"\n}';
      console.log("raw: ", raw);

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const response = await fetch(
        "https://mwz304qtva.execute-api.us-east-2.amazonaws.com/go_ing",
        requestOptions
      );
      const json = await response.json();
      const ingArr = json.ing;
      setPosArr(json.ing);
      console.log("json: ", json.ing);
      console.log("ingArr: ", ingredients);
      console.log("setIngredientslen: ", setIngredients.length);

      console.log("setIngredients = 0: ", setIngredients.length > 0);
    } catch (err) {
      console.log("error1: ", err);
    }
  };

  const getRecipes = async () => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "text/plain");

    const raw = '{"ing":"' + ingredients + '"}';
    console.log("raw: ", raw);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch(
      "https://mwz304qtva.execute-api.us-east-2.amazonaws.com/go_recipe",
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => setRecipe(result.recipe))
      .catch((error) => console.log("error", error));
  };

  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>;
  }

  let button;
  if (image) {
    if (posArr[0]) {
      button = (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 50,
          }}
        >
          <Text>{posArr[guessInc]}</Text>
          {/* if (posArr.length === (guessInc - 1)) */}
          <Button onPress={() => setGuessInc(guessInc - 1)} icon="arrowleft" />
          <Button title={posArr[guessInc]} />
          <Button onPress={() => setGuessInc(guessInc + 1)} icon="arrowright" />
          <Button
            onPress={() => {
              setImage(null);
              setPosArr([]);
              setGuessInc(0);
            }}
            icon="reload1"
          />
          <Button
            onPress={() => {
              setIngredients((ingredients) => [
                ...ingredients,
                posArr[guessInc],
              ]);
              setImage(null);
              setPosArr([]);
              setGuessInc(0);
            }}
            icon="check"
          />

          {/* <Button title="Save" onPress={storePicture} icon="check" /> */}
        </View>
      );
    } else {
      button = (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 50,
          }}
        >
          <Button
            title="Re-take"
            onPress={() => setImage(null)}
            icon="reload1"
          />
          <Button title="Save" onPress={storePicture} icon="check" />
        </View>
      );
    }
  } else {
    button = (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 50,
        }}
      >
        <Button title="Take a picture" onPress={takePicture} icon="camera" />
        {setIngredients.length > 0 ? (
          <Button onPress={getRecipes} icon="play" />
        ) : (
          <></>
        )}
      </View>
    );
  }

  // let recipeButton;

  // if (posArr[0]) {
  //   recipeButton = <Button onPress={getRecipes} icon="play" />;
  // } else {
  //   recipeButton = (
  //     <Button title="Take a picture" onPress={takePicture} icon="camera" />
  //   );
  // }
  let cards;
  if (!image) {
    cards = (
      <Camera
        style={styles.camera}
        type={type}
        ref={cameraRef}
        flashMode={flash}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 30,
          }}
        >
          <Button
            title=""
            icon="reload1"
            onPress={() => {
              setType(
                type === CameraType.back ? CameraType.front : CameraType.back
              );
            }}
          />
          <Button
            onPress={() =>
              setFlash(
                flash === Camera.Constants.FlashMode.off
                  ? Camera.Constants.FlashMode.on
                  : Camera.Constants.FlashMode.off
              )
            }
            icon="star"
            color={flash === Camera.Constants.FlashMode.off ? "gray" : "#fff"}
          />
        </View>
      </Camera>
    );
  } else {
    cards = <Image source={{ uri: image }} style={styles.camera} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.controls}>{cards}</View>

      <View style={styles.controls}>{button}</View>
    </View>
  );
}

export default withAuthenticator(App, { includeGreetings: true });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    // paddingTop: Constants.statusBarHeight,
    backgroundColor: "#000",
    // padding: 8,
  },
  controls: {
    flex: 0.5,
  },
  button: {
    height: 40,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#E9730F",
    marginLeft: 10,
  },
  camera: {
    flex: 5,
    // borderRadius: 20,
  },
  topControls: {
    flex: 1,
  },
});
