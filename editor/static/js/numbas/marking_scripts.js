Numbas.queueScript('marking_scripts',['marking'],function() {
    Numbas.raw_marking_scripts = {
        "matrixentry": 
"rows (The number of rows in the student's answer): len(studentanswer)\n\ncols (The number of columns in the student's answer): if(rows>0,len(studentanswer[0]),0)\n\ncorrect_rows (The number of rows in the correct answer): len(settings['correctAnswer'])\n\ncorrect_cols (The number of columns in the correct answer): len(settings['correctAnswer'][0])\n\nnum_cells (The number of cells in the student's answer): rows*cols\n\ncell_indexes (The index of each cell in the student's answer): \n    product(list(0..rows-1), list(0..cols-1))\n\nstudent_cell_precisions (Precision the student used in each cell):\n    switch(\n        settings[\"precisionType\"]=\"dp\",\n            map(map(countDP(cell),cell,row), row, studentAnswer)\n        ,\n        settings[\"precisionType\"]=\"sigfig\",\n            map(map(countsigfigs(cell),cell,row), row, studentAnswer)\n        ,\n        map(map(0,cell,row),row,studentAnswer)\n    )\n\nall_same_precision:\n    if(len(student_cell_precisions)=0 or all(map(all(map(toGivenPrecision(c,settings[\"precisionType\"],student_cell_precisions[0][0],settings[\"strictPrecision\"]),c,row)),row,studentAnswer)),\n        true\n    ,\n        feedback(translate(\"part.matrix.not all cells same precision\"));\n        false\n    )\n\nstudentPrecision (Maximum precision student used, or the required precision, whichever's higher):\n    max(settings[\"precision\"], max(map(max(row),row,student_cell_precisions)))\n\nallowFractions: settings[\"allowFractions\"]\n\nstudentNumbers:\n    if(settings[\"allowFractions\"],\n        map(map(parseNumber_or_fraction(c, \"en\"), c, row), row, studentAnswer)\n    ,\n        map(map(parseNumber(c, \"en\"), c, row), row, studentAnswer)\n    )\n\nstudentMatrix (The student's answer, with each cell parsed to numbers): \n    matrix(studentNumbers)\n\nempty_cells (The positions of the cells in the student's answer which have been left empty):\n  filter(trim(studentAnswer[p[0]][p[1]])=\"\", p, cell_indexes)\n\nany_empty (Are any of the cells empty?):\n  assert(len(empty_cells)=0,\n    warn(translate(\"part.matrix.empty cell\"));\n    fail(translate(\"part.matrix.empty cell\"));\n    true\n  )\n\ninvalid_cells (The positions of the cells in the student's answer which can't be interpreted as numbers):\n    filter(isnan(studentNumbers[p[0]][p[1]]), p, cell_indexes)\n\nany_invalid (Are any of the cells invalid?):\n    assert(len(invalid_cells)=0,\n        warn(translate(\"part.matrix.invalid cell\"));\n        fail(translate(\"part.matrix.invalid cell\"));\n        true\n    )\n\nwrong_precision_cells (The indexes of the cells which are given to the wrong precision):\n    filter(not toGivenPrecision(studentAnswer[p[0]][p[1]], settings[\"precisionType\"], settings[\"precision\"], settings[\"strictPrecision\"]), p, cell_indexes)\n\nwrong_precision (Has every cell been given to the correct precision?):\n    assert(len(wrong_precision_cells)=0,\n        multiply_credit(settings['precisionPC'], settings[\"precisionMessage\"])\n    )\n\nwrong_size (Does the student's answer have the wrong dimensions?):\n    assert(rows=correct_rows and cols=correct_cols,\n        incorrect();\n        end()\n    )\n\nrounded_student_matrix (The student's answer, with each cell rounded to studentPrecision): \n    map(\n        switch(\n            settings[\"precisionType\"]=\"dp\",\n            precround(c, studentPrecision),\n            settings[\"precisionType\"]=\"sigfig\",\n            siground(c, studentPrecision),\n            c\n        ),\n        c,\n        studentMatrix\n    )\n\nrounded_correct_matrix:\n    map(\n        map(\n            switch(\n                settings[\"precisionType\"]=\"dp\",\n                precround(c, studentPrecision),\n                settings[\"precisionType\"]=\"sigfig\",\n                siground(c, studentPrecision),\n                c\n            ),\n            c,\n            row\n        ),\n        row,\n        settings[\"correctAnswer\"]\n    )\n\ncorrect_cells (The indexes of the cells which are correct):\n    filter(\n        if(p[0]<correct_rows and p[1]<correct_cols,\n            withinTolerance(rounded_student_matrix[p[0]][p[1]], rounded_correct_matrix[p[0]][p[1]], settings['tolerance']),\n            false\n        ),\n        p, \n        cell_indexes\n    )\n\nmark:\n    apply(any_empty);\n    apply(any_invalid);\n    assert(settings[\"precisionType\"]=\"none\" and not settings[\"allowFractions\"], apply(all_same_precision));\n    apply(wrong_size);\n    if(len(correct_cells)=len(cell_indexes),\n        correct()\n    ,\n        if(settings['markPerCell'],\n            set_credit(len(correct_cells)/num_cells,translate('part.matrix.some incorrect',[\"count\":num_cells-len(correct_cells)]))\n        ,\n            incorrect();\n            end()\n        )\n    );\n    apply(wrong_precision)\n\ninterpreted_answer (The student's answer, to be reused by other parts):\n  studentMatrix\n",
        "patternmatch": 
"regex_match (Match the student's answer with the correct answer, interpreted as a regular expression):\n  match_regex(settings[\"correctAnswer\"],studentAnswer)\n\nregex_match_case_insensitive (Match the student's answer with the correct answer, interpreted as a case-insensitive regular expression):\n  match_regex(settings[\"correctAnswer\"],studentAnswer,\"i\")\n\nexact_match (Is the student's answer exactly the correct answer?):\n  studentAnswer=settings[\"correctAnswer\"]\n\nexact_match_case_insensitive (Is the student's answer exactly the correct answer?):\n  lower(studentAnswer)=lower(settings[\"correctAnswer\"])\n\nmatches (Does the student's answer match the correct answer?):\n  switch(\n    settings[\"matchMode\"]=\"regex\", len(regex_match)>0,\n    settings[\"matchMode\"]=\"exact\", exact_match,\n    false\n  )\n      \nmatches_case_insensitive (Does the student's answer match the correct answer, ignoring case?):\n  switch(\n    settings[\"matchMode\"]=\"regex\", len(regex_match_case_insensitive)>0,\n    settings[\"matchMode\"]=\"exact\", exact_match_case_insensitive,\n    false\n  )\n     \n\nmark:\n  assert(len(studentAnswer)>0,fail(translate(\"part.marking.nothing entered\")));\n  if(settings[\"caseSensitive\"],\n    if(matches,\n      correct(),\n      if(matches_case_insensitive,\n        set_credit(settings[\"partialCredit\"],translate(\"part.patternmatch.correct except case\")),\n        incorrect()\n      )\n    ,\n      incorrect()\n    )\n  ,\n    if(matches_case_insensitive,\n      correct()\n    ,\n      incorrect()\n    )\n  )\n\ninterpreted_answer (The student's answer, to be reused by other parts):\n  studentAnswer\n",
        "numberentry": 
"studentNumber (The student's answer, parsed as a number):\n    if(settings[\"allowFractions\"],\n        parseNumber_or_fraction(studentAnswer,settings[\"notationStyles\"])\n    ,\n        parseNumber(studentAnswer,settings[\"notationStyles\"])\n    )\n\nisFraction (Is the student's answer a fraction?):\n    \"/\" in studentAnswer\n\nnumerator (The numerator of the student's answer, or 0 if not a fraction):\n    if(isFraction,\n        parseNumber(split(studentAnswer,\"/\")[0],settings[\"notationStyles\"])\n    ,\n        0\n    )\n\nisInteger (Is the student's answer an integer?):\n    countDP(studentAnswer)=0\n\ndenominator (The numerator of the student's answer, or 0 if not a fraction):\n    if(isFraction,\n        parseNumber(split(studentAnswer,\"/\")[1],settings[\"notationStyles\"])\n    ,\n        0\n    )\n\ncancelled (Is the student's answer a cancelled fraction?):\n    gcd(numerator,denominator)=1\n\ncleanedStudentAnswer:\n    cleannumber(studentAnswer, settings[\"notationStyles\"])\n\nstudentPrecision:\n    switch(\n        settings[\"precisionType\"]=\"dp\", max(settings[\"precision\"],countDP(cleanedStudentAnswer)),\n        settings[\"precisionType\"]=\"sigfig\", max(settings[\"precision\"],countsigfigs(cleanedStudentAnswer)),\n        0\n    )\n\nminvalue:\n    switch(\n        settings[\"precisionType\"]=\"dp\", precround(settings[\"minvalue\"],studentPrecision),\n        settings[\"precisionType\"]=\"sigfig\", siground(settings[\"minvalue\"],studentPrecision),\n        settings[\"minvalue\"]\n    )\n\nmaxvalue:\n    switch(\n        settings[\"precisionType\"]=\"dp\", precround(settings[\"maxvalue\"],studentPrecision),\n        settings[\"precisionType\"]=\"sigfig\", siground(settings[\"maxvalue\"],studentPrecision),\n        settings[\"maxvalue\"]\n    )\n\nvalidNumber (Is the student's answer a valid number?):\n    if(isNaN(studentNumber),\n        warn(translate(\"part.numberentry.answer invalid\"));\n        fail(translate(\"part.numberentry.answer invalid\"))\n    ,\n        true\n    )\n\nnumberInRange (Is the student's number in the allowed range?):\n    if(studentNumber>=minvalue and studentNumber<=maxvalue,\n        correct()\n    ,\n        incorrect();\n        end()\n    )\n\ncorrectPrecision (Has the student's answer been given to the desired precision?):     \n    if(togivenprecision(studentanswer,settings['precisionType'],settings['precision'],settings[\"strictPrecision\"]),\n        true\n    ,\n        multiply_credit(settings[\"precisionPC\"],settings[\"precisionMessage\"]);\n        false\n    )\n\nmark (Mark the student's answer):\n    apply(validNumber);\n    apply(numberInRange);\n    assert(numberInRange,end());\n    if(isFraction,\n        apply(cancelled)\n    ,\n        apply(correctPrecision)\n    )\n \ninterpreted_answer (The student's answer, to be reused by other parts):\n    studentNumber\n\n",
        "gapfill": 
"marked_original_order (Mark the gaps in the original order, mainly to establish if every gap has a valid answer):\n    map(\n        mark_part(gap[\"path\"],studentAnswer),\n        [gap,studentAnswer],\n        zip(gaps,studentAnswer)\n    )\n\ninterpreted_answers (The interpreted answers for each gap, in the original order):\n    map(\n        res[\"values\"][\"interpreted_answer\"],\n        res,\n        marked_original_order\n    )\n\nanswers (The student's answers to each gap):\n    if(settings[\"sortAnswers\"],\n        sort(interpreted_answers)\n    ,\n        interpreted_answers\n    )\n\ngap_order:\n    if(settings[\"sortAnswers\"],\n        sort_destinations(interpreted_answers)\n    ,\n        list(0..len(gaps)01)\n    )\n\ngap_feedback (Feedback on each of the gaps):\n  map(\n    let(result,submit_part(gaps[gap_number][\"path\"],answer),\n      feedback(translate('part.gapfill.feedback header',[\"index\":index]));\n      concat_feedback(result[\"feedback\"], result[\"marks\"]/marks);\n      result\n    ),\n    [gap_number,answer,index],\n    zip(gap_order,studentAnswer,list(1..len(gaps)))\n  )\n\nall_valid (Are the answers to all of the gaps valid?):\n  all(map(res[\"valid\"],res,marked_original_order))\n\nmark:\n  assert(all_valid or not settings[\"sortAnswers\"], fail(translate(\"question.can not submit\")));\n  apply(all_valid);\n  apply(answers);\n  apply(gap_feedback);\n  assert(all_valid or settings[\"sortAnswers\"], fail(\"\"))\n\ninterpreted_answer:\n  answers\n\n",
        "jme": 
"studentExpr (The student's answer, parsed): \n    assert(trim(studentAnswer)<>\"\",\n        warn(translate(\"part.marking.nothing entered\"));\n        fail(translate(\"part.marking.nothing entered\"))\n    );\n    try(\n        simplify(parse(studentAnswer),[])\n    , message,\n        warn(translate(\"part.jme.answer invalid\",[\"message\":message]));\n        fail(translate(\"part.jme.answer invalid\",[\"message\":message]))\n    )\n\ncleanedStudentString (The student's answer as a string, cleaned up): string(studentExpr)\n\nscope_vars (Variables already defined in the scope): \n    definedvariables()\n\nstudentVariables (Variables used in the student's answer): \n    set(findvars(studentExpr))-set(scope_vars)\n\nunexpectedVariables (Unexpected variables used in the student's answer):\n    let(uvars, filter(not (x in settings[\"expectedVariableNames\"]),x,list(studentVariables)),\n        assert(len(settings[\"expectedVariableNames\"])=0 or len(uvars)=0,\n            warn(translate(\"part.jme.unexpected variable name\",[\"name\":uvars[0]]))\n        );\n        uvars\n    )\n\nfailMinLength (Is the student's answer too short?):\n    assert(settings[\"minLength\"]=0 or len(cleanedStudentString)>=settings[\"minLength\"],\n        multiply_credit(settings[\"minLengthPC\"],settings[\"minLengthMessage\"]);\n        true\n    )\n\nfailMaxLength:\n    assert(settings[\"maxLength\"]=0 or len(cleanedStudentString)<=settings[\"maxLength\"],\n        multiply_credit(settings[\"maxLengthPC\"],settings[\"maxLengthMessage\"]);\n        true\n    )\n\nforbiddenStrings:\n    filter(x in cleanedStudentString, x, settings[\"notAllowed\"])\n\nforbiddenStringsPenalty:\n    assert(len(forbiddenStrings)=0,\n        translate(\n          if(len(settings[\"notAllowed\"])=1, 'part.jme.not-allowed one', 'part.jme.not-allowed several'),\n          [\"strings\":map(translate('part.jme.not-allowed bits',[\"string\":str]),str,forbiddenStrings)]\n        );\n        multiply_credit(settings[\"notAllowedPC\"],settings[\"notAllowedMessage\"])\n    )\n\nrequiredStrings:\n    filter(not (x in cleanedStudentString), x, settings[\"mustHave\"])\n\nrequiredStringsPenalty:\n    assert(len(requiredStrings)=0,\n        translate(\n          if(len(settings[\"mustHave\"])=1, 'part.jme.must-have one', 'part.jme.must-have several'),\n          [\"strings\":map(translate('part.jme.must-have bits',[\"string\":str]),str,forbiddenStrings)]\n        );\n        multiply_credit(settings[\"mustHavePC\"],settings[\"mustHaveMessage\"])\n    )\n\ncorrectExpr (The correct answer, parsed): \n    parse(settings[\"correctAnswer\"])\n\ncorrectVars (Variables used in the correct answer): \n    set(findvars(correctExpr))-set(scope_vars)\n\nvRange (The range to pick variable values from): \n    settings[\"vsetRangeStart\"]..settings[\"vsetRangeEnd\"]#0\n\nvset (The sets of variable values to test against):\n    repeat(\n        dict(map([x,random(vRange)],x,correctVars or studentVariables)),\n        settings[\"vsetRangePoints\"]\n    )\n\nagree (Do the student's answer and the expected answer agree on each of the sets of variable values?):\n    map(\n        try(\n            resultsEqual(eval(studentexpr,vars),eval(correctexpr,vars),settings[\"checkingType\"],settings[\"checkingAccuracy\"]),\n            message,\n            warn(translate(\"part.jme.answer invalid\",[\"message\":message]));\n            fail(translate(\"part.jme.answer invalid\",[\"message\":message]));\n            false\n        ),\n        vars,\n        vset\n    )\n\nnumFails (The number of times the student's answer and the expected answer disagree): \n    apply(agree);\n    len(filter(not x,x,agree))\n\nnumericallyCorrect (Is the student's answer numerically correct?):\n    apply(numFails);\n    if(numFails<settings[\"failureRate\"],\n        correct(translate(\"part.jme.marking.correct\"))\n    ,\n        incorrect()\n    )\n\nsameVars (Does the student use the same variables as the correct answer?):\n    if(studentVariables=correctVars,\n        true\n    ,\n        incorrect();\n        end();\n        false\n    )\n\nmark:\n    apply(studentExpr);\n    apply(unexpectedVariables);\n    apply(sameVars);\n    apply(numericallyCorrect);\n    apply(failMinLength);\n    apply(failMaxLength);\n    apply(forbiddenStringsPenalty);\n    apply(requiredStringsPenalty)\n\ninterpreted_answer (The student's answer, to be reused by other parts):\n    studentExpr\n\n",
        "multipleresponse": 
"numAnswers: len(settings[\"matrix\"])\n\nnumChoices: if(numAnswers=1,1,len(settings[\"matrix\"][0]))\n\nnumTicks (How many options did the student tick?):\n  sum(map(sum(row),row,studentAnswer))\n\nwrongNumber:\n  assert(numTicks >= settings[\"minAnswers\"] and (settings[\"maxAnswers\"]=0 or numTicks<=settings[\"maxAnswers\"]),\n    if(settings[\"warningType\"]=\"prevent\",\n        fail(translate(\"part.mcq.wrong number of choices\"))\n    ,\n        incorrect(translate(\"part.mcq.wrong number of choices\"));\n        end()\n    )\n  )\n\ntick_indexes (Indexes of choice/answer pairs):\n  product(list(0..(numAnswers-1)),list(0..(numChoices-1)))\n\nscore_ticks (The score for each choice/answer pair):\n  map(\n    if(studentAnswer[x][y],\n      let(distractor,settings[\"distractors\"][x][y], credit, if(marks=0,0,settings[\"matrix\"][x][y]/marks),\n        switch(\n          credit<>0,\n            if(not nonemptyhtml(distractor),\n              add_credit(credit,translate(if(credit>0,'part.mcq.correct choice','part.mcq.incorrect choice')))\n            ,\n              add_credit(credit,distractor)\n            )\n          ,\n            if(nonemptyhtml(distractor),feedback(distractor),if(marks<>0,feedback(translate('part.mcq.incorrect choice')),false))\n        );credit\n      )\n    ,\n      0\n    ),\n    [x,y],\n    tick_indexes\n  )\n\ntotal_score: sum(score_ticks)\n\nmark:\n  assert(marks>0,correct());  // any answer is correct when 0 marks are available\n  assert(numTicks>0,\n    warn(translate(\"part.marking.nothing entered\"));\n    fail(translate(\"part.marking.nothing entered\"))\n  );\n  apply(wrongNumber);\n  apply(score_ticks)\n\ninterpreted_answer (The student's answer, to be reused by other parts):\n  studentAnswer\n"
    };
	Numbas.marking_scripts = {};
    for(var x in Numbas.raw_marking_scripts) {
        Numbas.marking_scripts[x] = new Numbas.marking.MarkingScript(Numbas.raw_marking_scripts[x]);
    }
});
