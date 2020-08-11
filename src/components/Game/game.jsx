import React, { Component } from "react";
import firebase from "firebase";
import { withFirebase } from "../FireBase";
import Chessboard from "./chessboard";
import { AuthUserContext } from "../Session";
import Chat from "./chat";
import { ImageBackground, View } from "react-native";
import endgameBackground from "../pictures/endgame/EndgameNotification.png"

const Game = ({ authUser, match }) => (
  <div>
    <AuthUserContext.Consumer>
      {(authUser) =>
        authUser ? <GameFinal uid={authUser.uid} gameId={match.params.id} /> :
          <GameFinal uid={0} gameId={match.params.id} />
      }
    </AuthUserContext.Consumer>
  </div>
);

class GameWithUID extends Component {
  constructor(props) {
    super(props);

    this.database = this.props.firebase.db;
    this.game = this.database.ref("games/" + this.props.gameId);
    this.colorPref = this.game.child("color_pref");
    this.white = this.game.child("white_id");
    this.black = this.game.child("black_id");
    this.checkmate = this.game.child("checkmate");
    this.moveLog = this.game.child("move_log");
    this.moveNum = this.game.child("move_num");

    this.state = {
      gameId: this.props.gameId,
      countOne: 0,
      countTwo: 0,

      colorPref: "",
      whiteId: "",
      blackId: "",

      checkmate: 0,

      moveLog: [],
      moveNum: 0,
      loaded: false
    };
  }

  async componentDidMount() {
    if (this.props.uid === 0) {
      await firebase.auth().signInAnonymously();
    }
    let colorPref;
    await this.colorPref.once("value", (snap) => {
      colorPref = snap.val();
    });
    this.checkmate.on("value", (snap) => {
      this.setState({
        checkmate: snap.val(),
      });
    });
    this.white.on("value", (snapshot) => {
      let blackId;
      this.black.once("value", (snap) => {
        blackId = snap.val();
      })
      this.setState({
        whiteId: snapshot.val(),
      });
      if (colorPref === "white") {
        if (snapshot.val() === 0 && this.props.uid)
          this.white.set(this.props.uid);
      }
      else {
        if (
          snapshot.val() === 0 &&
          blackId !== 0 &&
          blackId !== this.props.uid
          && this.props.uid
        )
          this.white.set(this.props.uid);
      }
    });
    this.black.on("value", (snapshot) => {
      let whiteId;
      this.white.once("value", (snap) => {
        whiteId = snap.val();
      })
      this.setState({
        blackId: snapshot.val(),
      });
      if (colorPref === "white") {
        if (
          snapshot.val() === 0 &&
          whiteId !== 0 &&
          whiteId !== this.props.uid
          && this.props.uid
        )
          this.black.set(this.props.uid);
      }
      else {
        if (snapshot.val() === 0 && this.props.uid)
          this.black.set(this.props.uid);
      }
    });
    this.moveLog.on("value", (snap) => {
      this.setState({ moveLog: snap.val() });
    });
    this.moveNum.on("value", (snap) => {
      this.setState({ moveNum: snap.val() });
    });
    this.setState({ loaded: true });
  }

  render() {
    let gameExists;
    let winMenu;
    let moveLog = [];
    this.database.ref("games").once('value', snapshot => {
      if (snapshot.hasChild(this.state.gameId))
        gameExists = true;
      else
        gameExists = false;
    })
    if (gameExists) {
      if (this.state.checkmate !== 0) {
        if (this.state.checkmate === "draw")
          winMenu = <h1>Draw</h1>
        else
          winMenu =
            this.state.checkmate === "white" ? (
              <h1 class="kalyant-bold endgameText">White Wins!</h1>
            ) : (
                <h1 class="kalyant-bold endgameText">Black Wins!</h1>
              );
      }
      for (let i = 0; i < this.state.moveLog.length; i++) {
        moveLog.push(
          <tr>
            <th scope="row">{i + 1}</th>
            <td>{this.state.moveLog[i][0]}</td>
            <td>{this.state.moveLog[i][1]}</td>
          </tr>
        )
      }
    }
    let error = gameExists ? null : <h1>Loading... (if not loaded soon, game does not exist anymore)</h1>;
    return (
      <div className='main_content'>
        {error}
        {gameExists && this.state.loaded && <div>
          <Chat
            uid={this.props.uid}
            whiteId={this.state.whiteId}
            blackId={this.state.blackId}
            gameId={this.props.gameId}
          />
          <div class="row centered">
            <div class="col-sm-2">
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col"> </th>
                    <th scope="col">White</th>
                    <th scope="col">Black</th>
                  </tr>
                </thead>
                <tbody>
                  {moveLog}
                </tbody>
              </table>
            </div>
            <div class="col-sm-8">
              <Chessboard
                uid={this.props.uid}
                whiteId={this.state.whiteId}
                blackId={this.state.blackId}
                gameId={this.props.gameId}
              />
            </div>
          </div>
          <View class="endgameMenu">
            <ImageBackground style={{ width: '100%', height: '100%', flex: 1 }} resizeMode='cover' source={endgameBackground}>
              {winMenu}
            </ImageBackground>
          </View>
        </div>}
      </div>
    );
  }
}

const GameFinal = withFirebase(GameWithUID);

export default Game;
