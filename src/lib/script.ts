/** The Luau tracker developers paste into their game. Runs on the server only, so the secret never reaches clients. */
export function trackerScript(appUrl: string, secret: string) {
  return `--!strict
-- BloxBoost player tracker
-- 1) Put this as a Script (not LocalScript) in ServerScriptService.
-- 2) Game Settings > Security > turn ON "Allow HTTP Requests", then publish.
-- Every 60 seconds it sends BloxBoost the user ids of players in this server,
-- so people who found your game on BloxBoost get credit for playing. Nothing else is sent.

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local ENDPOINT = "${appUrl}/api/track"
local SECRET = "${secret}" -- keep private, don't put this in a LocalScript

local function send()
	local ids = {}
	for _, player in Players:GetPlayers() do
		if player.UserId > 0 then
			table.insert(ids, player.UserId)
		end
	end
	local ok, err = pcall(function()
		HttpService:PostAsync(
			ENDPOINT,
			HttpService:JSONEncode({ secret = SECRET, players = ids }),
			Enum.HttpContentType.ApplicationJson
		)
	end)
	if not ok then
		warn("[BloxBoost] tracker request failed: " .. tostring(err))
	end
end

task.spawn(function()
	send()
	while true do
		task.wait(60)
		send()
	end
end)
`;
}
