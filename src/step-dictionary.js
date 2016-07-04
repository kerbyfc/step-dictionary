import path from 'path';
import _ from 'lodash';
import fs from 'fs';
import glob from 'glob';
import generateReport from './generate-report';

module.exports = class StepDictionary {
  constructor(pathArg) {
    this.paths = this._getAllPaths(pathArg);
    this.stepDefinitions = this._getStepDefinitions();
  }

  getStepsJson() {
    return this.stepDefinitions;
  }

  getStepThatMatches(phrase) {
    return this.stepDefinitions.filter(function(stepDef) {
      return stepDef.regex.test(phrase);
    });
  }

  outputReport(outputPath) {
    let report = generateReport(this.stepDefinitions);
    fs.writeFileSync(outputPath, report);
  }

  _getStepDefinitions() {
    let stepDefinitions = [];

    this.paths.forEach((filePath) => {
      let fileData;

      try {
        fileData = fs.readFileSync(filePath, {encoding: 'utf8'});
      } catch (e) {
        console.log(path + ' could not be read, will skip and continue', e);
      }

      if (fileData) {
          var re = /@(given|then)\(\s*\/\^(.*)\$\/\).*\n*.*\((.*)\)/g,
              definition;
          while ((definition = re.exec(fileData)) !== null) {
            stepDefinitions.push({
              keyword: definition[1],
              regex: definition[2],
              params: definition[3],
              file: filePath,
              line: fileData.slice(0, definition.index).split(/\n/).length
            });
          }
        }
      }
    });

    return stepDefinitions;
  }

  _getAllPaths(pathArg) {
    let paths = (typeof pathArg === 'string') ? [pathArg] : pathArg;
    return _.flattenDeep(paths.map((filePath) => {
      if (path.parse(filePath).ext) {
        return path.resolve(filePath);
      } else {
        return glob.sync(path.join(filePath, '**', '*.js'));
      }
    }));
  }
};
