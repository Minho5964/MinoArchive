/*

DB 모듈: https://github.com/NyangBotLab/DBManager_deploy
(AGPL 라이선스 - https://github.com/NyangBotLab/DBManager_deploy/blob/main/License.md)

*/

// DB 호출
const DB = require('DBManager_deploy/modules/DBManager').DBManager;
var myUserId = FileStream.read('sdcard/bot/myUserId.txt');
var DBListener = DB.getInstance("com.kakao.talk", myUserId, true);

//로그
var log_path = 'sdcard/bot/log.json';
var log = JSON.parse(FileStream.read(log_path));
if (!FileStream.read(log_path)) FileStream.write(log_path, '{}');

//전체보기
var blank = "\u200b".repeat(500);

//현재시간 호출
function getDate() {
    let now = new Date();
    let month = String(now.getMonth() + 1).padStart(2, '0');
    let day = String(now.getDate()).padStart(2, '0');
    let hour = String(now.getHours()).padStart(2, '0');
    let minute = String(now.getMinutes()).padStart(2, '0');
    return String('[' + month + '/' + day + ' ' + hour + ':' + minute + '] ');
}


DBListener.on("message", (chat, channel) => {

    if (log[channel.id] == undefined) {
        log[channel.id] = {};
        FileStream.write(log_path, JSON.stringify(log, null, 4));
    }
    if (log[channel.id][chat.user.id] == undefined) {
        log[channel.id][chat.user.id] = { "nickName": chat.user.name, "enter": 1, "exit": 0, "enex_log": [], "nick_log": [] };
        FileStream.write(log_path, JSON.stringify(log, null, 4));
    }

    //닉변감지
    if (chat.user.name != log[channel.id][chat.user.id].nickName && log[channel.id][chat.user.id].nickName != undefined) {
        log[channel.id][chat.user.id]['nick_log'].push(getDate() + log[channel.id][chat.user.id].nickName + " 에서 " + chat.user.name + " (으)로 닉네임 변경");
        var in_out = '닉네임 변경 로그\n\n'
        var nick_log_list = log[channel.id][chat.user.id]['nick_log'];
        for (var i = 0; i < nick_log_list.length; i++) {
            in_out += nick_log_list[i] + '\n';
        }
        channel.send(log[channel.id][chat.user.id].nickName + "님의 닉변 감지!\n이전 닉: " + log[channel.id][chat.user.id].nickName + "\n변경 닉: " + chat.user.name + blank + "\n\n" + in_out);
        log[channel.id][chat.user.id].nickName = chat.user.name;
        FileStream.write(log_path, JSON.stringify(log, null, 4));
    }

    //로그
    //답장
    if (chat.text == "!로그") {
        if (chat.isReply()) {
            var in_out = '입퇴장 로그\n'
            var enex_log_list = log[channel.id][chat.source.user.id]['enex_log'];
            for (var i = 0; i < enex_log_list.length; i++) {
                in_out += enex_log_list[i] + '\n';
            }
            in_out += '\n\n--------------------------\n닉네임 변경 로그\n'
            var nick_log_list = log[channel.id][chat.source.user.id]['nick_log'];
            for (var i = 0; i < nick_log_list.length; i++) {
                in_out += nick_log_list[i] + '\n';
            }
            channel.send(chat.source.user.name + " 님의 로그입니다." + blank + '\n\n' + in_out);
        } else {
            channel.send("사용된 답장 또는 @멘션이 없습니다.")
        }
    }
    //멘션
    if (chat.text.startsWith("!로그 ")) {
        if (chat.text.indexOf("@") != -1) {
            let log_id = chat.attachment.mentions[0].user_id;
            var in_out = '입퇴장 로그\n'
            var enex_log_list = log[channel.id][chat.attachment.mentions[0].user_id]['enex_log'];
            for (var i = 0; i < enex_log_list.length; i++) {
                in_out += enex_log_list[i] + '\n';
            }
            in_out += '총 '+ log[channel.id][chat.attachment.mentions[0].user_id]['enter'] + '번 입장하셨습니다.\n\n--------------------------\n닉네임 변경 로그\n'
            var nick_log_list = log[channel.id][chat.attachment.mentions[0].user_id]['nick_log'];
            for (var i = 0; i < nick_log_list.length; i++) {
                in_out += nick_log_list[i] + '\n';
            }
            channel.send(DBListener.getChatManager().getOneUserByID(log_id).name + " 님의 로그입니다." + blank + '\n\n' + in_out);
        } else {
            channel.send("사용된 답장 또는 @멘션이 없습니다.")
        }
    }

});

DBListener.on("join", (chat, channel) => { //입장
    if (log[channel.id][chat.joinUsers[0].userId] == undefined) { //첫 입장이라면
        log[channel.id][chat.joinUsers[0].userId] = { "nickName": chat.joinUsers[0].nickName, "enter": 1, "exit": 0, "enex_log": [], "nick_log": [] };
    } else { //첫 입장이 아니라면
        log[channel.id][chat.joinUsers[0].userId].nickName = chat.joinUsers[0].nickName;
        log[channel.id][chat.joinUsers[0].userId].enter++;
    }
    log[channel.id][chat.joinUsers[0].userId]['enex_log'].push(getDate() + chat.joinUsers[0].nickName + ' (으)로 입장');
    var in_out = '입퇴장 로그\n'
    var enex_log_list = log[channel.id][chat.joinUsers[0].userId]['enex_log'];
    for (var i = 0; i < enex_log_list.length; i++) {
        in_out += enex_log_list[i] + '\n';
    }
    in_out += '\n\n--------------------------\n닉네임 변경 로그\n'
    var nick_log_list = log[channel.id][chat.joinUsers[0].userId]['nick_log'];
    for (var i = 0; i < nick_log_list.length; i++) {
        in_out += nick_log_list[i] + '\n';
    }
    channel.send("안녕하세요 " + chat.joinUsers[0].nickName + "님 " + log[channel.id][chat.joinUsers[0].userId]['enter'] + "번째 입장입니다!" + blank + '\n\n' + in_out);
    FileStream.write(log_path, JSON.stringify(log, null, 4));
});


DBListener.on("leave", (chat, channel) => {//퇴장
    if (log[channel.id][chat.leaveUser.userId] == undefined) { //첫 퇴장이라면
        log[channel.id][chat.leaveUser.userId] = { "nickName": chat.leaveUser.nickName, "enter": 1, "exit": 1, "enex_log": [], "nick_log": [] };
    } else { //첫 퇴장이 아니라면
        log[channel.id][chat.leaveUser.userId].nickName = chat.leaveUser.nickName;
        log[channel.id][chat.leaveUser.userId].exit++;
    }
    log[channel.id][chat.leaveUser.userId]['enex_log'].push(getDate() + chat.leaveUser.nickName + ' (으)로 퇴장');
    var in_out = '입퇴장 로그\n'
    var enex_log_list = log[channel.id][chat.leaveUser.userId]['enex_log'];
    for (var i = 0; i < enex_log_list.length; i++) {
        in_out += enex_log_list[i] + '\n';
    }
    in_out += '\n\n--------------------------\n닉네임 변경 로그\n'
    var nick_log_list = log[channel.id][chat.leaveUser.userId]['nick_log'];
    for (var i = 0; i < nick_log_list.length; i++) {
        in_out += nick_log_list[i] + '\n';
    }
    channel.send(chat.joinUsers[0].nickName + "님이 " + log[channel.id][chat.joinUsers[0].userId]['enter'] + "번째 퇴장하셨습니다." + blank + '\n\n' + in_out);
    FileStream.write(log_path, JSON.stringify(log, null, 4));

});

DBListener.on("kick", (chat, channel) => { //강제퇴장
    if (log[channel.id][chat.kickedUser.userId] == undefined) { //첫 퇴장이라면
        log[channel.id][chat.kickedUser.userId] = { "nickName": chat.kickedUser.nickName, "enter": 1, "exit": 1, "enex_log": [], "nick_log": [] };
    } else { //첫 퇴장이 아니라면
        log[channel.id][chat.kickedUser.userId].nickName = chat.kickedUser.nickName;
        log[channel.id][chat.kickedUser.userId].exit++;
    }
    log[channel.id][chat.kickedUser.userId]['enex_log'].push(getDate() + chat.leaveUser.nickName + ' (으)로 강제퇴장');
    var in_out = '입퇴장 로그\n'
    var enex_log_list = log[channel.id][chat.kickedUser.userId]['enex_log'];
    for (var i = 0; i < enex_log_list.length; i++) {
        in_out += enex_log_list[i] + '\n';
    }
    in_out += '\n\n--------------------------\n닉네임 변경 로그\n'
    var nick_log_list = log[channel.id][chat.kickedUser.userId]['nick_log'];
    for (var i = 0; i < nick_log_list.length; i++) {
        in_out += nick_log_list[i] + '\n';
    }
    channel.send(chat.kickedBy.name + "님이 " + chat.kickedUser.nickName + "님을 내보냈습니다." + blank + '\n\n' + in_out);
    FileStream.write(log_path, JSON.stringify(log, null, 4));
})

DBListener.start();

function onNotificationPosted(sbn) {
    DBListener.addChannel(sbn);
}

function onStartCompile() {
    DBListener.stop();
}
