This is a document covering feedback from my partner, Erin, while she was playing the game:

#Erin's Feedback

##Tutorial
===
1: Need clear button to go to next page in addition to the spacebar.  Recall that kids can't read well so the button needs to be obvious.  Maybe clicking anywhere should go to the next page
   as well.
2: Need to read all of the dialog (some of the title text wasn't being read)
3: Need to describe all of the spell casting mechanics: pressing spacebar, holding spacebar, this needs to be kept up-to-date with the actual design of the game.
   Focus on the actual basic mechanisms of the game here, kids don't want to be clicking through


##Spell Dialog
===
- Right now the spell dialog just keeps letting you cast spells. The number of spells should be limited to like 2 and then grow to 3, 4, 5 with powerup items.
- The dialog should auto-fire the spell when you hit the maximum number of spells.
- The timer mechanic was interesting but needs to be pushed back to at least 4th / 5th grade reading level. It's possible that the timer should come from a power up you can only get at 
  later levels.
- We should not get repeat words.  Use a shuffle / sampling without repeat method to pick the words for the spell dialog.
- The timer in the spell dialog should have a number counter, so should the spell limit if that applies instead.  Should be easy to see how many spells you have left.


##General Map
- We are not able to view some of the generated tiles, let's generate a ring of impenetrable wall tiles at the end of the map 3 tiles deep.  We want to make sure we are never masking out any of
  the walkable areas.
- The Map is too zoomed out on my kid's little chromebook screen.  Let's make the map tiles bigger and restrict the number of tiles we are showing at a time.
  We are doing 16x16 right now, how about let's try 10x10, but keep the visible area the same size (or maybe even slightly larger?)
- The HP / MP meters are hard to read.  There should be a big number, don't worry about displaying the number as a fraction.  The fullness bar is still good, but let's put MP on one side and HP on the other.
- Also there is a random green bar at the top that shows up sometimes, that's a bug, please remove it.
- The maps need to be much bigger, and most of the rooms should be enemy rooms.  Treasure and shop rooms should show up much less often ( like 1/10 or 2/10 rooms at most )
- All rooms must be reachable from the entrance.  We need tests verifying this ( could be unit tests that just generate a ton of rooms ).


##Progression Stuff
- There should be more levels to tween between the difficulty levels.  For example, between what are now difficulty 1 and 2 there should be another level that is half one, half two. This is just because 1 and 2 are so close in reading level. For the rest of the difficulties, we should probably space them out with another 4 levels.  Between 2 and 3, there should be 4 more levels that smoothly transition to what is now the 3rd level.  Between 3 and 4, there should be 4 levels that are gradually increasing in difficulty, with monster levels increasing.

##Enemy Stuff
- Monster level should dictate what words can show up in the spell dialog.  Level 1 monsters get level 1 words, level 2 monsters get level 2 words, etc.
- Level 1 monsters fall off in likelyhood after level 1, level 2 monsters fall off in likelyhood after level 2, etc.  This sort of goes hand in hand with the extra levels with tweening in there described above.

##Boss Stuff
===
- The Boss room should be farthest from the starting area by A* distance.  We should have some unit tests for this.
- The Boss should be harder than the normal enemies.  It should be like 4-5x as hard as regular enemies.
- Bosses should be introducing some words from the next difficulty level, at some probability, maybe mostly giving words from the current level's difficulty.
  Sort of fits into the tweening dynamic here too.

##Word lists
- Can we double check the size of our word-lists? Do we have the full set of words at each level?  If not, we should find or generate them. It felt like we were repeating words too often, and
  never hit obvious words like "dog".


##Other Stuff
- The game-over overlay isn't covering the middle of the screen, it should just cover all of the game board, like the "You Died" screen in Elden Ring or Dark Souls.
- The game-over overlay needs a large obvious button to click to take us back
- The game-over transition should be to the home screen, not to immediately start a new game
- The game-over overlay in general could use some work, would be cool to have like snow-flakes falling and like a tombstone with flowers or something silly but also with a display of your high-score (number of points earned, powerups gathered, words read, rooms / floors explored, etc).


##Revised spell dialog:
- We should have a display like a want charging up as more words have been read.
  1 word read = wand glowing ball at the end
  2 words read = wand glowing ball sparlking at the end
  3 words read = energy (appropriate for spell type) crackling at the end
  4 words read = strongly pulsing energy, crackling at the end with a small amount of particles (appropriate for spell type) coming off end
  5 words read = strongly pulsing energy, crackling, warping space a bit, particles (appropriate for spell type) coming off of end
  You get the idea: cool graphic instead of just a counter for combo, to make the kids excited about combos.

- Rune items increase max combo words.


##Revised spell mechanics:
- Spells attack only one enemy, the nearest one.  Can use the arrow key to select a different enemy in range from the spell dialog.
- When spell fires off, a projectile goes flying at the enemy of the appropriate spell type and strength (bigger damager == bigger projectile, more particles and effects on spell)

##Enemies should drop rewards very occasionally (like every 4-10 enemies or so)
- Health potions / food
- Runes (much more rare, maybe 1 every 2-3 levels max)

##Rune types
- Multi-shot runes (fires at multiple enemies, does less damage per shot)
- Health stealing (steals like 1% or 2%, will need to be tuned to not be OP)
