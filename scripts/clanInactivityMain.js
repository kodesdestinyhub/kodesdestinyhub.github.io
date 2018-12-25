$('#onlyShowRed').change(function() {
  if ($("#onlyShowRed").is(":checked")) {
    $(".notRed").addClass("hidden");
  } else {
    $(".notRed").removeClass("hidden");
  }
})
var tableSorter = $("#memberList").stupidtable();
var searching = false;
var memberCount = 0;
moment.locale("en-au");

function searchClan() {
  if (searching) {
    console.log("already searching");
    searching = false;
    return false;
  }
  searching = true;
  var clanID = document.getElementById("clanInput").value.trim();
  if (!clanID.length) {
    alert("Enter a clan name");
    searching = false;
    return false;
  }
  $("#memberList").addClass("hidden");
  $("#memberList tbody").empty();
  $.ajax({
    url: "https://www.bungie.net/Platform/GroupV2/" + clanID + "/Members/?CurrentPage=1",
    headers: {
      "X-API-KEY": "93aa54198b0f467d9fd3e856235c9177"
    }
  }).done(function(json) {
    console.log(json.Response);
    if (!json.Response) {
      console.log(json.Message);
      alert("Could not connect to the bungie servers.");
      searching = false;
      return false;
    }
    if (json.Response.length < 1) {
      alert("No clan was found");
      searching = false;
      return false;
    }
    memberCount = json.Response.results.length;
    getMembers(json.Response.results);
  }).fail(function() {
    alert("Search Failed");
    searching = false;
  })
}

function getMembers(members) {
  console.log(moment.locale());
  var promises = [];
  var currentMember = 1;
  for (var a = 0; a < members.length; a++) {
    if (members[a].isOnline && !$("#onlyShowRed").is(":checked")) {
      $("#memberList tbody").append("<tr class='notRed'><td>" + members[a].destinyUserInfo.displayName + "</td><td data-sort-value='" + moment().unix() + "'>Online Now</td></tr>");
      $("#memberListProgress").text("Loaded " + currentMember + "/" + memberCount);
      $("#memberListProgress").removeClass("hidden");
      currentMember++;
    } else if (members[a].isOnline) {
      $("#memberList tbody").append("<tr class='notRed hidden'><td>" + members[a].destinyUserInfo.displayName + "</td data-sort-value='" + moment().unix() + "'><td>Online Now</td></tr>");
      $("#memberListProgress").text("Loaded " + currentMember + "/" + memberCount);
      $("#memberListProgress").removeClass("hidden");
      currentMember++;
    } else {
      var request = $.ajax({
        url: "https://www.bungie.net/Platform/Destiny2/4/Profile/" + members[a].destinyUserInfo.membershipId + "/?Components=100,200",
        headers: {
          "X-API-KEY": "93aa54198b0f467d9fd3e856235c9177"
        }
      }).done(function(json) {
        var lastPlayed = null;
        if (!json.Response) {
          console.log(json.Message);
          return false;
        }
        var timeInSession;
        $.each(json.Response.characters.data, function(key, value) {
          if (lastPlayed === null) {
            lastPlayed = moment(value.dateLastPlayed);
            timeInSession = value.minutesPlayedThisSession;
          } else {
            if (moment.max(lastPlayed, moment(value.dateLastPlayed)) != lastPlayed) {
              lastPlayed = moment(value.dateLastPlayed);
              timeInSession = value.minutesPlayedThisSession;
            }
          }
        });
        console.log(json.Response);
        if (lastPlayed.isBefore(moment().subtract(30, 'days')) || timeInSession == 0) {
          $("#memberList tbody").append("<tr class='danger'><td>" + json.Response.profile.data.userInfo.displayName.split("#")[0] + "</td><td data-sort-value='" + lastPlayed.unix() + "'>" + lastPlayed.fromNow() + " (" + lastPlayed.format("HH:mm Do MMMM YYYY") + ") " + timeInSession + " mins played that session." + "</td></tr>");
        } else if (!$("#onlyShowRed").is(":checked")) {
          $("#memberList tbody").append("<tr class='notRed'><td>" + json.Response.profile.data.userInfo.displayName.split("#")[0] + "</td><td data-sort-value='" + lastPlayed.unix() + "'>" + lastPlayed.fromNow() + " (" + lastPlayed.format("HH:mm Do MMMM YYYY") + ") " + timeInSession + " mins played that session." + "</td></tr>");
        } else {
          $("#memberList tbody").append("<tr class='notRed hidden'><td>" + json.Response.profile.data.userInfo.displayName.split("#")[0] + "</td><td data-sort-value='" + lastPlayed.unix() + "'>" + lastPlayed.fromNow() + " (" + lastPlayed.format("HH:mm Do MMMM YYYY") + ") " + timeInSession + " mins played that session." + "</td></tr>");
        }
        $("#memberListProgress").text("Loaded " + currentMember + "/" + memberCount);
        $("#memberListProgress").removeClass("hidden");
        currentMember++;
      })
      promises.push(request);
    }
  }
  $.when.apply(null, promises).done(function() {
    console.log("finished");
    tableSorter.find("thead th").eq(1).stupidsort('asc');
    $("#memberListProgress").addClass("hidden");
    $("#memberList").removeClass("hidden");
    searching = false;
  })
}
