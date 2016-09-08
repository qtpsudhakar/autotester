test.describe('show errors', function () {
  let driver;

  const {runCode, getConsoleLines, textToLines} = runContext;

  test.before(function () {
    driver = runContext.driver = new Driver();
    driver.get(runContext.selftest.ui);
    driver.wait(until.titleContains('loaded'));
  });

  test.after(function () {
    driver.quit();
  });

  test.describe('without test-runner', function () {

    test.it('should show error in syntax before driver started', function () {
      runCode(`
        abc()
      `);
      getConsoleLines().then(lines => {
        assert(lines[0]).equalTo('ReferenceError: abc is not defined');
        assert(lines[1]).equalTo('at snippets/test.js:2:9');
      })
    });

    test.it('should show error inside driver flow', function () {
      runCode(`
        const driver = new Driver();
        driver.call(() => {
          abc()
        });
      `);
      getConsoleLines().then(lines => {
        assert(lines[0]).equalTo('ReferenceError: abc is not defined');
        assert(lines[1]).equalTo('at driver.call (snippets/test.js:4:11)');
      })
    });

  });

  test.describe('with test-runner', function () {

    test.it('should show syntax error in describe()', function () {
      runCode(`
        test.describe('suite', function () {
          abc();
        })
      `);
      getConsoleLines().then(lines => {
        assert(lines[0]).equalTo('ReferenceError: abc is not defined');
        assert(lines[1]).equalTo('at Suite.<anonymous> (snippets/test.js:3:11)');
      });
    });

    test.it('should show syntax error in it()', function () {
      runCode(`
        test.describe('suite', function () {
          test.it('test', function () {
            abc();
          })
        })
      `);
      getMochaErrorLines().then(lines => {
        assert(lines[0]).equalTo('ReferenceError: abc is not defined');
        assert(lines[1]).equalTo('at Context.<anonymous> (snippets/test.js:4:13)');
      })
    });

    test.it('should show error in driver flow', function () {
      runCode(`
        test.describe('suite', function () {
          let driver;
          test.it('test', function () {
            driver = new Driver();
            driver.call(() => {
              abc()
            })
          })
          test.after(function () {
            driver.quit();
          })
        })
      `);
      getMochaErrorLines().then(lines => {
        assert(lines[0]).equalTo('ReferenceError: abc is not defined');
        assert(lines[1]).equalTo('at driver.call (snippets/test.js:7:15)');
      })
    });

  });

  function getMochaErrorLines() {
    return driver.findElement({css: '#mocha-report .error'}).getText()
      .then(textToLines)
      .catch(e => [])
  }
});
