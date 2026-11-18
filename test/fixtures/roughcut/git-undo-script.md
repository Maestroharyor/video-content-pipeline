How to Undo a Git Commit (Even After Push) and Recover Lost Work
Oct 31, 2026 · @josh
YouTube script | About 1,240 spoken words, roughly 8:00 at 155 words per minute
[00:00] Intro
Have you ever committed something to Git, only to realise a few seconds later that you made a mistake?
Maybe you committed the wrong files, deleted some important code, or pushed a commit to GitHub that you wish you could take back.
Well, the good news is that Git gives us several ways to undo commits and even recover work we thought was lost.
In this video, we'll look at how to undo your most recent commit, the difference between git reset and git revert, how to undo a commit that has already been pushed, and how to recover lost commits using Git reflog.
We'll also look at Git stash, which allows you to temporarily save changes without committing them.
Let's get into it.
[00:40] Part 1: The three places your code lives
Before we undo anything, you need one mental picture. Every undo command in this video just moves changes between three places.
(ON SCREEN: Three boxes labelled Working directory, Staging area, Repository. A file icon moves left to right as each command is mentioned.)
The working directory is the files you're editing. The staging area is where you collect the changes for your next commit. And the repository is your saved history of commits.
Think of online shopping. The working directory is the store, the staging area is your cart, and the repository is your order history.
To put something in the cart, you use git add.
git add .
This stages every change in the current folder and everything inside it: edited, deleted and new files, as long as they're not ignored.
Or you can be picky and stage just the files you want:
git add login.js styles.css
Then you check out:
git commit -m "Add login functionality"
Now here's the detail that matters for the rest of this video. That commit only exists on your machine. It doesn't reach GitHub until you run git push.
(ON SCREEN: A fourth box labelled Remote (GitHub) appears to the right of Repository, with an arrow labelled git push.)
(ON SCREEN: Small caption under the Remote box: "GitHub, GitLab, Bitbucket, or any Git host. The commands are the same." Show the three logos side by side.)
So keep one question in your head: has the commit been pushed yet? That answer decides which undo command is safe.
[01:45] Part 2: Undoing a commit with git reset
Say your history looks like this.
(ON SCREEN: Simple history.)
A -- B -- C
C is your latest commit, and it's wrong.
git reset moves your branch back to an earlier commit. Its three modes decide what happens to C's changes.
--soft: keep the changes staged
git reset --soft HEAD~1
HEAD is the commit you're on. HEAD~1 is the one before it. So this says: move my branch back by one.
C disappears from the history, but its changes are still in the staging area, ready to commit again.
(ON SCREEN: C slides off the history line, and its changes drop into the Staging area box.)
You cancelled the order, but everything is still in your cart. Perfect when you forgot to include a file.
And if all you got wrong was the message, skip reset and run git commit --amend instead.
[05:20] Part 4: Recovering lost commits with git reflog
git reflog
(ON SCREEN: Sample reflog output.)
9f2c1ab HEAD@{0}: reset: moving to HEAD~1
e4f5a6b HEAD@{1}: commit: Add payment validation
The top line is the reset. The line below is where you were right before it. That's commit C.
[07:10] Outro
And now you know the one Git action you'll never need to undo: hitting subscribe. No reset, no revert, no reflog required. So go ahead. Hit subscribe, and push it.
On this channel, we keep breaking down modern software, one problem at a time. See you in the next one.
Review notes
Accuracy fixes
• git reset --hard doesn't only discard "the affected changes". It overwrites all tracked files to match the target commit.
• The sample reflog hash e4f5g6h wasn't valid (Git hashes only use 0-9 and a-f).
