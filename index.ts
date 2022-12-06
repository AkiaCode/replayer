#!/usr/bin/env node
import { authenticate, createHttp1Request } from 'league-connect'
import { readFile } from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

function sleep(ms: number) {
  const wakeUpTime = Date.now() + ms;
  while (Date.now() < wakeUpTime) {}
}

// pnpm run start [MatchIds.json] [Number] [replay_path]

yargs(hideBin(process.argv))
  .command('download', '', {
    matchids: {
      describe: 'MatchID Path (JSON File)',
      demand: true,
      alias: 'm',
      type: 'string'
    },
    number: {
      describe: 'Match Number',
      demand: false,
      alias: 'n',
      type: 'number'
    },
    replay: {
      describe: 'Replay Path Setting',
      demand: false,
      alias: 'r',
      type: 'string'
    }
  }, (yargs) => {
    readFile(yargs.matchids, async (err, data) => {
      if (err) {
        return console.error(err)
      }
      const json = JSON.parse(data.toString())
      const credentials = await authenticate()

      if (yargs.replay !== undefined) {
        await createHttp1Request(
          {
            method: 'PATCH',
            url: `/lol-settings/v1/local/lol-replays`,
            body: {
              data: {
                "replays-folder-path": yargs.replay
              },
              schemaVersion: 1
            }
          },
          credentials)
      }

      const replay_path = await createHttp1Request(
        {
          method: 'GET',
          url: `/lol-settings/v1/local/lol-replays`,
        },
        credentials)
      const replay_json = JSON.parse(replay_path.text())
      console.log("Replay Path: " + replay_json.data["replays-folder-path"])
    
      console.log("length: "+json.matchId.length+"\n")
      console.time("replay file extractor")
      let num = 0;
      for (const i in json.matchId) {
        if (yargs.number !== undefined && num === Number(yargs.number)) {
          break
        }


        console.log("match id: "+json.matchId[i].replace('EUW1_', ''))
    
        await createHttp1Request(
          {
            method: 'POST',
            url: `/lol-replays/v1/rofls/${json.matchId[i].replace('EUW1_', '')}/download/graceful`,
            body: {
              componentType: "string"
            }
          },
          credentials,
        )
        console.log("number: "+(num+1)+"\n")
        num += 1
        sleep(7000)
      }
      console.timeEnd("replay file extractor")
      console.log("Finish!!!")
    })
  })
  .demandCommand(1)
  .scriptName('replayer')
  .help('h')
  .parse()
