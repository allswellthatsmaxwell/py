import {Button, Modal, Text, TouchableOpacity, View} from "react-native";
import * as React from "react";
import {Feather, FontAwesome, MaterialCommunityIcons} from "@expo/vector-icons";
import firebase from "firebase";

import {getStyles} from "./styles";
import HeaderContext from './HeaderContext';

const styles = getStyles();

// @ts-ignore
export function Header({navigation}: any) {
  const { user, selectedTopic, setSelectedTopic, historySelected, setHistorySelected } = React.useContext(HeaderContext);


  // @ts-ignore
  const handleBackPress = () => {
    navigation.goBack();
    setSelectedTopic(null);
    setHistorySelected(false);
  };


  function AuthStatusElements() {
    const [showMenu, setShowMenu] = React.useState(false);
    const handlePress = () => {
      setShowMenu(!showMenu);
    };

    return (
        <View style={styles.topRightCornerFirstPositionContainer}>
          <TouchableOpacity onPress={handlePress}>
            <FontAwesome name="user-circle" size={34} color="black"/>
          </TouchableOpacity>
          <Modal visible={showMenu} animationType="fade" transparent={true}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text>Signed in as {user.email}.</Text>
                <Button
                    title="Sign Out"
                    onPress={() => firebase.auth().signOut()}
                />
                <Button title="Close" onPress={handlePress}/>
              </View>
            </View>
          </Modal>
        </View>
    );
  }


  function BackButton() {
    return (
        <View style={styles.topLeftCornerContainer}>
          <TouchableOpacity onPress={handleBackPress}>
            <Feather name="arrow-left-circle" size={36} color="black"/>
          </TouchableOpacity>
        </View>
    );
  }


  function HistoryButton() {
    return (
        <View style={styles.topRightCornerSecondPositionContainer}>
          <TouchableOpacity onPress={() => { setHistorySelected(true)} }>
            <MaterialCommunityIcons name="file-document-multiple" size={34} color="black" />
          </TouchableOpacity>
        </View>
    );
  }

  return (
      <View style={styles.headerContainer}>
        {user && user.email && <AuthStatusElements/>}
        {(!historySelected && !selectedTopic) &&
          <HistoryButton/>
        }

        {(selectedTopic || historySelected) && (<BackButton/>)}
      </View>
  );

}