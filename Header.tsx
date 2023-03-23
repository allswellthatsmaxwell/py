import {Button, Modal, Text, TouchableOpacity, View} from "react-native";
import * as React from "react";
import {Feather, FontAwesome, MaterialCommunityIcons} from "@expo/vector-icons";
import firebase from "firebase";

import {getStyles} from "./styles";

const styles = getStyles();

export function Header({user, selectedTopic, historySelected, setHistorySelected, handleBackPress}:
                           {
                             user: any,
                             selectedTopic: string,
                             historySelected: boolean,
                             setHistorySelected: (historySelected: boolean) => void,
                             handleBackPress: () => void
                           }) {
  return (
      <View style={styles.headerContainer}>
        <AuthStatusElements/>
        <HistoryButton setHistorySelected={setHistorySelected}/>

        {(selectedTopic || historySelected) && (<BackButton/>)}
      </View>
  );

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


  function HistoryButton({setHistorySelected}: any) {
    return (
        <View style={styles.topRightCornerSecondPositionContainer}>
          <TouchableOpacity onPress={() => setHistorySelected(true)}>
            <MaterialCommunityIcons name="file-document-multiple" size={34} color="black"/>
          </TouchableOpacity>
        </View>
    );
  }
}