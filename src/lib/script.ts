/** The Luau playtime check developers paste into their game. Runs on the server only, so the secret never reaches clients. */
export function trackerScript(appUrl: string, secret: string) {
  return `--!strict
-- Spawnswap playtime check
-- 1) Put this as a Script (not LocalScript) in ServerScriptService.
-- 2) Game Settings > Security > turn ON "Allow HTTP Requests", then publish.
--
-- What it does: once a minute it tells Spawnswap which of the players who chose
-- your game on Spawnswap are still in this server, so their 10 minutes count.
-- It only reports players Spawnswap asked about. Other players are never sent.
-- It shows no ads, adds no UI, and gives no Robux, items or rewards in your game.

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local ENDPOINT = "${appUrl}/api/track"
local SECRET = "${secret}" -- keep private, don't put this in a LocalScript

local watch: { [string]: boolean } = {}

local function send()
	local ids = {}
	for _, player in Players:GetPlayers() do
		if watch[tostring(player.UserId)] then
			table.insert(ids, player.UserId)
		end
	end
	local ok, res = pcall(function()
		return HttpService:PostAsync(
			ENDPOINT,
			HttpService:JSONEncode({ secret = SECRET, players = ids }),
			Enum.HttpContentType.ApplicationJson
		)
	end)
	if not ok then
		warn("[Spawnswap] playtime check failed: " .. tostring(res))
		return
	end
	local decoded, data = pcall(function()
		return HttpService:JSONDecode(res)
	end)
	if decoded and type(data) == "table" and type(data.watch) == "table" then
		local nextWatch: { [string]: boolean } = {}
		for _, id in data.watch do
			nextWatch[tostring(id)] = true
		end
		watch = nextWatch
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
