import { withAuthenticator } from "aws-amplify-react-native";

import React, { useState, useEffect, useRef } from "react";
import {
  ImageBackground,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  AppRegistry,
  SafeAreaView,
  Dimensions,
  Animated,
  ScrollView,
} from "react-native";
import Constants from "expo-constants";
import { Camera, CameraType } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { MaterialIcons } from "@expo/vector-icons";
// import Button from "./src/components/Button";
import Button_Switch_Flash from "./src/components/Button_Switch_Flash";
import { Amplify, Storage } from "aws-amplify";
import config from "./src/aws-exports";
import mime from "mime-types";
import {
  Avatar,
  Button,
  Card,
  Text,
  FAB,
  IconButton,
  MD3Colors,
} from "react-native-paper";
// import { Provider as PaperProvider } from "react-native-paper";
import {
  MD3LightTheme as DefaultTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import { name as appName } from "./app.json";

Amplify.configure({
  ...config,
  Analytics: {
    disabled: true,
  },
});

const OFFSET = 40;
const ITEM_WIDTH = Dimensions.get("window").width - OFFSET * 2;
const ITEM_HEIGHT = (Dimensions.get("window").height - OFFSET * 2) * 0.85;

function App() {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [image, setImage] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);
  const cameraRef = useRef(null);
  const [posArr, setPosArr] = useState([]);
  const [guessInc, setGuessInc] = useState(0);
  const [ingredients, setIngredients] = useState([
    "rice",
    "butter",
    "bell pepper",
    "egg",
  ]);
  const [recipe, setRecipe] = useState([]);
  const [ing, setIng] = useState([], []);
  const [inst, setInst] = useState([], []);
  const [imageDish, setImageDish] = useState([], []);
  const [loading, setLoading] = useState(false);
  const [recipeDict, setRecipeDict] = useState({});
  const [recipeGenerated, setRecipeGenerated] = useState(false);
  const LeftContent = (props) => <Avatar.Icon {...props} icon="folder" />;
  const scrollX = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      MediaLibrary.requestPermissionsAsync();
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === "granted");
    })();
  }, []);

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: "blue",
      secondary: "yellow",
    },
  };

  const takePicture = async () => {
    if (cameraRef) {
      try {
        setLoading(true);
        const data = await cameraRef.current.takePictureAsync();
        console.log(data);
        setImage(data.uri);
        setLoading(false);
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
      setLoading(true);
      await Storage.put(imageName, blobData, access);
      setLoading(false);
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

    try {
      setLoading(true);
      await fetch(
        "https://mwz304qtva.execute-api.us-east-2.amazonaws.com/go_recipe",
        requestOptions
      )
        .then((resp) => resp.json())
        .then((json) => {
          setRecipeDict(json);
          console.log("json: ", json);
          json.map((item, idx) => {
            setIng((ing) => [...ing, item.ing]);
            setInst((inst) => [...inst, item.inst]);
            setImageDish((image) => [...image, item.image]);
            console.log("item.ing: ", item.ing[0]);
            console.log("item.inst: ", item.inst[1]);
            console.log("item.image: ", item.image);
          });
        })
        .catch((error) => console.error("error", error))
        .finally(() => setLoading(false));
      console.log("recipeDict_1: ", recipeDict);
      setRecipeGenerated(true);
      setLoading(false);
      console.log("type: ", typeof recipeDict.ing);
      console.log("type1: ", typeof recipeDict.inst);
      console.log("val: ", recipeDict.ing);
      console.log("val1: ", recipeDict.inst);
    } catch (error) {
      console.log(error);
    }

    console.log("recipeDict_2: ", recipeDict);
  };

  const renderItem = () => {
    console.log("recipeDict_3: ", recipeDict);
  };

  const printingmachine = () => {
    recipeDict.map((recipe, index) => {
      console.log("recipe.recipe: ", recipe.recipe);
      console.log("recipe.ing: ", recipe.ing);
      console.log("recipe.inst: ", recipe.inst);
      setIng(recipe.ing);
      setInst(recipe.inst);
    });
    console.log("recipeDict_3: ", recipeDict);
    console.log("recipeDict_4: ", recipeDict.length > 0);
  };

  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>;
  }

  let recipeCard;

  if (ingredients.length > 0 && !recipeGenerated) {
    recipeCard = (
      <FAB
        style={{
          flex: 1,
          backgroundColor: "lightblue",
        }}
        animated={true}
        color={ingredients.length > 0 ? "white" : "grey"}
        disabled={false}
        visible={true}
        loading={loading}
        icon="play"
        onPress={ingredients.length > 0 ? getRecipes : null}
        // label='EXTENDED FAB'
      />
    );
  } else if (recipeGenerated) {
    recipeCard = <></>;
  }

  let button;
  if (image) {
    if (posArr[0]) {
      button = (
        <View
          style={{
            flexDirection: "row",
            // justifyContent: "space-between",
            position: "absolute",
            justifyContent: "center",
            alignItems: "center",
            bottom: 0,
            padding: 15,
            width: "100%",
            // paddingHorizontal: 50,
          }}
        >
          <Card>
            <View
              style={{
                flexDirection: "row",
                marginTop: 30,
                marginBottom: 30,
                padding: 10,
                width: "100%",
                // paddingHorizontal: 50,
              }}
            >
              <FAB
                style={{
                  backgroundColor: "skyblue",
                  padding: 10,
                }}
                animated={true}
                color="white"
                disabled={false}
                visible={true}
                loading={false}
                small
                icon="arrow-left"
                onPress={() => setGuessInc(guessInc - 1)}
                // label='EXTENDED FAB'
              />
              <Text
                variant="headlineMedium"
                ellipsizeMode="tail"
                numberOfLines={1}
                style={{ width: 100 }}
              >
                {posArr[guessInc]}
              </Text>
              <FAB
                style={{
                  backgroundColor: "skyblue",
                  padding: 10,
                }}
                animated={true}
                color="white"
                disabled={false}
                visible={true}
                loading={false}
                small
                icon="arrow-right"
                onPress={() => setGuessInc(guessInc + 1)}
                // label='EXTENDED FAB'
              />
              <FAB
                style={{
                  backgroundColor: "darkorange",
                  padding: 10,
                }}
                animated={true}
                color="white"
                disabled={false}
                visible={true}
                loading={false}
                small
                icon="redo-variant"
                onPress={() => {
                  setImage(null);
                  setPosArr([]);
                  setGuessInc(0);
                }}
                // label='EXTENDED FAB'
              />
              <FAB
                style={{
                  backgroundColor: "lightgreen",
                  padding: 10,
                }}
                animated={true}
                color="white"
                disabled={false}
                visible={true}
                loading={false}
                small
                icon="check"
                onPress={() => {
                  setIngredients((ingredients) => [
                    ...ingredients,
                    posArr[guessInc],
                  ]);
                  setImage(null);
                  setPosArr([]);
                  setGuessInc(0);
                }}
                // label='EXTENDED FAB'
              />
            </View>
          </Card>
        </View>
      );
    } else {
      button = (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            bottom: 0,
            padding: 15,
            flex: 1,
          }}
        >
          <FAB
            style={{
              flex: 1,
              justiftyContent: "center",
              alignItems: "center",
              textAlign: "center",
              backgroundColor: "rgba(52, 52, 52, 0)",
            }}
            animated={true}
            color="white"
            disabled={false}
            visible={true}
            loading={loading}
            mode="flat"
            size="large"
            icon="redo-variant"
            onPress={() => setImage(null)}
          ></FAB>
          <FAB
            style={{
              flex: 1,
              justiftyContent: "center",
              alignItems: "center",
              textAlign: "center",
              backgroundColor: "rgba(52, 52, 52, 0)",
            }}
            animated={true}
            color="white"
            disabled={false}
            visible={true}
            loading={loading}
            icon="robot-outline"
            mode="flat"
            size="large"
            onPress={storePicture}
          ></FAB>
        </View>
      );
    }
  } else {
    button = (
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          position: "absolute",
          bottom: 0,
          padding: 15,
          justiftyContent: "center",
          alignItems: "center",
          textAlign: "center",
          // paddingHorizontal: 50,
        }}
      >
        <View>
          <FAB
            style={{
              justiftyContent: "center",
              alignItems: "center",
              textAlign: "center",
              backgroundColor: "rgba(52, 52, 52, 0)",
            }}
            animated={true}
            color="white"
            disabled={false}
            visible={true}
            loading={loading}
            icon="menu"
            mode="flat"
            size="large"
            onPress={ingredients.length > 2 ? getRecipes : null}
            // label='EXTENDED FAB'
          />
        </View>
        <View
          style={{
            flex: 1,
            justiftyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <IconButton
            style={{
              backgroundColor: "rgba(52, 52, 52, 0)",
            }}
            icon="circle-outline"
            iconColor="white"
            size={125}
            onPress={takePicture}
          />
        </View>
        <View>
          <FAB
            style={{
              justiftyContent: "center",
              alignItems: "center",
              textAlign: "center",
              backgroundColor: "rgba(52, 52, 52, 0)",
            }}
            animated={true}
            color="white"
            disabled={false}
            visible={true}
            loading={loading}
            icon={
              ingredients.length > 2 ? "robot-outline" : "robot-off-outline"
            }
            mode="flat"
            size="large"
            onPress={ingredients.length > 2 ? getRecipes : null}
            // label='EXTENDED FAB'
          />
        </View>
      </View>
    );
  }

  let cards;
  if (!image && !(recipeDict && recipeDict.length > 0)) {
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
            padding: 15,
          }}
        >
          <FAB
            style={{
              backgroundColor: "white",
            }}
            animated={true}
            color="black"
            disabled={false}
            visible={true}
            loading={false}
            small
            icon="camera-flip"
            onPress={() => {
              setType(
                type === CameraType.back ? CameraType.front : CameraType.back
              );
            }}
            // label='EXTENDED FAB'
          />
          <FAB
            style={{
              backgroundColor: "white",
            }}
            animated={true}
            color="black"
            disabled={false}
            visible={true}
            loading={false}
            small
            icon={
              flash === Camera.Constants.FlashMode.off ? "flash" : "flash-off"
            }
            onPress={() =>
              setFlash(
                flash === Camera.Constants.FlashMode.off
                  ? Camera.Constants.FlashMode.on
                  : Camera.Constants.FlashMode.off
              )
            }
            // label='EXTENDED FAB'
          />
        </View>
        {button}
      </Camera>
    );
  } else if (recipeDict && recipeDict.length > 0) {
    cards = (
      <View>
        <View
          style={{
            flexDirection: "row",
            // marginTop: 30,
            // marginBottom: 30,
            // padding: 10,
            // width: "95%",
            // paddingHorizontal: 50,
          }}
        >
          <ScrollView
            horizontal={true}
            decelerationRate={"normal"}
            snapToInterval={ITEM_WIDTH}
            // style={{ paddingHorizontal: 10 }}
            showsHorizontalScrollIndicator={false}
            bounces={false}
            disableIntervalMomentum
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={12}
          >
            {recipeDict.map((item, idx) => {
              const inputRange = [
                (idx - 1) * ITEM_WIDTH,
                idx * ITEM_WIDTH,
                (idx + 1) * ITEM_WIDTH,
              ];

              const translate = scrollX.interpolate({
                inputRange,
                outputRange: [0.85, 1, 0.85],
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.5, 1, 0.5],
              });

              return (
                <Card
                  style={{
                    width: ITEM_WIDTH,
                    height: ITEM_HEIGHT,
                    marginLeft: idx === 0 ? OFFSET : undefined,
                    marginRight:
                      idx === recipeDict.length - 1 ? OFFSET : undefined,
                    opacity: opacity,
                    transform: [{ scale: translate }],
                  }}
                >
                  <Card.Title title={item.recipe} />
                  <Card.Cover source={{ uri: item.image[0] }} />
                  <Card.Content>
                    <Text variant="titleLarge">Ingredients:</Text>
                    <Text variant="bodyMedium">{item.ing}</Text>
                    <Text variant="titleLarge">Instructions:</Text>
                    <Text variant="bodyMedium">{item.inst}</Text>
                  </Card.Content>
                </Card>
              );
            })}
          </ScrollView>
        </View>
        <FAB
          style={{
            backgroundColor: "darkorange",
          }}
          animated={true}
          color="black"
          disabled={false}
          visible={true}
          loading={false}
          small
          icon="redo-variant"
          onPress={() => {
            setRecipeDict([]);
            setIngredients([]);
          }}
          // label='EXTENDED FAB'
        />
      </View>
    );
  } else {
    const imageURI = { uri: image };
    cards = (
      <View style={styles.camera}>
        <ImageBackground
          source={imageURI}
          resizeMode="cover"
          style={styles.camera}
        >
          {button}
        </ImageBackground>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <SafeAreaView style={styles.MainContainer}>{cards}</SafeAreaView>
    </PaperProvider>
  );
}

export default withAuthenticator(App, { includeGreetings: true });

AppRegistry.registerComponent(appName, () => App);

const styles = StyleSheet.create({
  MainContainer: {
    flex: 1,
    justifyContent: "center",
  },
  fabStyle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 50,
    backgroundColor: "darkorange",
  },
  fabUnavailable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 50,
    backgroundColor: "grey",
  },
  fabPlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 50,
  },
  camera: {
    flex: 1,
  },
});
