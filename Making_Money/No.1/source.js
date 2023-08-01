/*

DB 모듈: https://github.com/NyangBotLab/DBManager_deploy
(AGPL 라이선스 - https://github.com/NyangBotLab/DBManager_deploy/blob/main/License.md)

*/


const DB = require('DBManager_deploy/modules/DBManager').DBManager;

function getDate() {
    let now = new Date();
    let month = String(now.getMonth() + 1).padStart(2, '0');
    let day = String(now.getDate()).padStart(2, '0');
    let hour = String(now.getHours()).padStart(2, '0');
    let minute = String(now.getMinutes()).padStart(2, '0');
    return String(month + '/' + day + ' ' + hour + ':' + minute);
}

var myUserId = FileStream.read('sdcard/bot/myUserId.txt');
var log_path = 'sdcard/bot/log.json';
var log = JSON.parse(FileStream.read(log_path));
var blank = "\u200b".repeat(500);

var DBListener = DB.getInstance("com.kakao.talk", myUserId, true);
if (!FileStream.read(log_path)) FileStream.write(log_path, '{}');

DBListener.on("message", (chat, channel) => {

    if (log[channel.id] == undefined) log[channel.id] = {};
    if (log[channel.id][chat.user.id] == undefined) log[channel.id][chat.user.id] = { "nickName": chat.user.name, "enter": 1, "exit": 0, "log": [] };

    if (chat.user.name != log[channel.id][chat.user.id].nickName && log[channel.id][chat.user.id].nickName != undefined) {
        channel.send(log[channel.id][chat.user.id].nickName + "님의 닉변 감지!\n이전 닉: " + log[channel.id][chat.user.id].nickName + "\n변경 닉: " + chat.user.name);
        log[channel.id][chat.user.id].nickName = chat.user.name;
        FileStream.write(log_path, JSON.stringify(log, null, 4));
    }

});

DBListener.on("join", (chat, channel) => { //입장
    if (log[channel.id][chat.joinUsers[0].userId] == undefined) { //첫 입장이라면
        log[channel.id][chat.joinUsers[0].userId] = { "nickName": chat.joinUsers[0].nickName, "enter": 1, "exit": 0, "log": ['[' + getDate() + '] 입장'] };
    } else { //첫 입장이 아니라면
        log[channel.id][chat.joinUsers[0].userId].nickName = chat.joinUsers[0].nickName;
        log[channel.id][chat.joinUsers[0].userId].enter++;
        log[channel.id][chat.joinUsers[0].userId]['log'].push('[' + getDate() + '] 입장');
    }
    var in_out = '';
    for (var i = 0; i < log[channel.id][chat.joinUsers[0].userId]['log'].length; i++) {
        in_out += log[channel.id][chat.joinUsers[0].userId]['log'][i] + '\n';
    }
    channel.send("안녕하세요 " + chat.joinUsers[0].nickName + "님 " + log[channel.id][chat.joinUsers[0].userId]['enter'] + "번째 입장입니다!" + blank + '\n\n' + in_out);
    FileStream.write(log_path, JSON.stringify(log, null, 4));
});


DBListener.on("leave", (chat, channel) => {//퇴장
    var currentTime = getDate();
    if (log[channel.id][chat.leaveUser.userId] == undefined) { //첫 퇴장이라면
        log[channel.id][chat.leaveUser.userId] = { "nickName": chat.leaveUser.nickName, "enter": 1, "exit": 1, "log": [getDate()] };
    } else { //첫 퇴장이 아니라면
        log[channel.id][chat.leaveUser.userId].nickName = chat.leaveUser.nickName;
        log[channel.id][chat.leaveUser.userId].exit++;
        log[channel.id][chat.leaveUser.userId]['log'].push('[' + currentTime + '] 퇴장');
    }
    var in_out = '';
    for (var i = 0; i < log[channel.id][chat.leaveUser.userId]['log'].length; i++) {
        in_out += log[channel.id][chat.leaveUser.userId]['log'][i] + '\n';
    }
    channel.send(chat.leaveUser.nickName + "님이 " + currentTime + "에 퇴장하셨습니다." + blank + '\n\n' + in_out);
    FileStream.write(log_path, JSON.stringify(log, null, 4));
});

DBListener.on("kick", (chat, channel) => { //강제퇴장
    channel.send(chat.kickedBy.name + "님이 " + chat.kickedUser.nickName + "님을 강퇴했습니다")
    var currentTime = getDate();
    if (log[channel.id][chat.kickedUser.userId] == undefined) { //첫 퇴장이라면
        log[channel.id][chat.kickedUser.userId] = { "nickName": chat.kickedUser.nickName, "enter": 1, "exit": 1, "log": [getDate()] };
    } else { //첫 퇴장이 아니라면
        log[channel.id][chat.kickedUser.userId].nickName = chat.kickedUser.nickName;
        log[channel.id][chat.kickedUser.userId].exit++;
        log[channel.id][chat.kickedUser.userId]['log'].push('[' + currentTime + '] 퇴장');
    }
    channel.send(chat.kickedBy.name + "님이 " + chat.kickedUser.nickName + "님을 " + currentTime + "에 강퇴하였습니다.");
    FileStream.write(log_path, JSON.stringify(log, null, 4));
})

DBListener.start();
