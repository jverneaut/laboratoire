const NodeGit = require('nodegit');
const { join } = require('path');
const deasync = require('deasync');

const getFirstCommitDateForFile = async filePath => {
  const date = await NodeGit.Repository.open(join(__dirname, '../../.git'))
    .then(async repo => {
      const masterCommit = await repo.getMasterCommit();

      const walker = repo.createRevWalk();
      walker.push(masterCommit.sha());
      walker.sorting(NodeGit.Revwalk.SORT.TIME);

      return walker.fileHistoryWalk(filePath, 500);
    })
    .then(commits => {
      if (commits) {
        return commits[commits.length - 1].commit.date();
      } else {
        return Date.now();
      }
    });

  return date;
};

const getFirstCommitDateForFileSync = deasync(async (filePath, cb) => {
  const date = await getFirstCommitDateForFile(filePath);
  cb(null, date);
});

module.exports = {
  getFirstCommitDateForFile,
  getFirstCommitDateForFileSync,
};
