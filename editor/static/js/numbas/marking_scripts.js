Numbas.queueScript('marking_scripts',['marking'],function() {
    Numbas.raw_marking_scripts = {
        "gapfill": 
"marked_original_order (Mark the gaps in the original order, mainly to establish if every gap has a valid answer):\n    map(\n        mark_part(gap[\"path\"],studentAnswer),\n        [gap,studentAnswer],\n        zip(gaps,studentAnswer)\n    )\n\ninterpreted_answers (The interpreted answers for each gap, in the original order):\n    map(\n        res[\"values\"][\"interpreted_answer\"],\n        res,\n        marked_original_order\n    )\n\nanswers (The student's answers to each gap):\n    if(settings[\"sortAnswers\"],\n        sort(interpreted_answers)\n    ,\n        interpreted_answers\n    )\n\ngap_order:\n    if(settings[\"sortAnswers\"],\n        sort_destinations(interpreted_answers)\n    ,\n        gap_adaptive_order\n    )\n\nanswer_order:\n    if(settings[\"sortAnswers\"],\n        0..(len(studentAnswer)-1)\n    ,\n        gap_adaptive_order\n    )\n\ngap_feedback (Feedback on each of the gaps):\n    map(\n        try(\n            let(\n                answer, studentAnswer[answer_number],\n                result, submit_part(gaps[gap_number][\"path\"],answer),\n                gap, gaps[gap_number],\n                name, gap[\"name\"],\n                noFeedbackIcon, not gap[\"settings\"][\"showFeedbackIcon\"],\n                non_warning_feedback, filter(x[\"op\"]<>\"warning\",x,result[\"feedback\"]),\n                    assert(noFeedbackIcon,\n                        assert(name=\"\" or len(gaps)=1 or len(non_warning_feedback)=0,feedback(translate('part.gapfill.feedback header',[\"name\": name])))\n                    );\n                    concat_feedback(non_warning_feedback, if(marks>0,result[\"marks\"]/marks,1/len(gaps)), noFeedbackIcon);\n                    result\n            ),\n            err,\n            fail(translate(\"part.gapfill.error marking gap\",[\"name\": gaps[gap_number][\"name\"], \"message\": err]))\n        ),\n        [gap_number,answer_number],\n        zip(gap_order,answer_order)\n    )\n\nall_valid (Are the answers to all of the gaps valid?):\n  all(map(res[\"valid\"],res,marked_original_order))\n\nmark:\n  assert(all_valid or not settings[\"sortAnswers\"], fail(translate(\"question.can not submit\")));\n  apply(answers);\n  apply(gap_feedback)\n\ninterpreted_answer:\n  answers\n\npre_submit:\n    map(\n        let(\n            answer, studentAnswer[answer_number],\n            result, submit_part(gaps[gap_number][\"path\"],answer),\n            check_pre_submit(gaps[gap_number][\"path\"], answer, exec_path)\n        ),\n        [gap_number,answer_number],\n        zip(gap_order,answer_order)\n    )\n",
        "jme": 
"expand_juxtapositions_settings (Settings for the \"expand juxtapositions\" step):\n    [\n        \"singleLetterVariables\": settings[\"singleLetterVariables\"],\n        \"noUnknownFunctions\": not settings[\"allowUnknownFunctions\"],\n        \"implicitFunctionComposition\": settings[\"implicitFunctionComposition\"],\n        \"normaliseSubscripts\": true\n    ]\n\nstudentExpr (The student's answer, parsed):\n    assert(trim(studentAnswer)<>\"\" and parse(studentAnswer)<>parse(\"\"),\n        warn(translate(\"part.marking.nothing entered\"));\n        fail(translate(\"part.marking.nothing entered\"))\n    );\n    try(\n        simplify(\n            expand_juxtapositions(parse(studentAnswer), expand_juxtapositions_settings),\n            'basic'\n        )\n    , message,\n        warn(translate(\"part.jme.answer invalid\",[\"message\":message]));\n        fail(translate(\"part.jme.answer invalid\",[\"message\":message]));\n        nothing\n    )\n\ncleanedStudentString (The student's answer as a string, cleaned up): string(studentExpr)\n\nscope_vars (Variables already defined in the scope):\n    definedvariables()\n\ncorrectExpr (The correct answer, parsed):\n    expand_juxtapositions(parse(settings[\"correctAnswer\"]), expand_juxtapositions_settings)\n\nstudentMatch (The result of matching the student's expression against the pattern):\n    scope_case_sensitive(match(studentExpr,settings[\"mustMatchPattern\"]),settings[\"caseSensitive\"])\n\ncorrectMatch (The result of matching the correct answer against the pattern):\n    scope_case_sensitive(match(correctExpr,settings[\"mustMatchPattern\"]),settings[\"caseSensitive\"])\n\ncompareName (The name of the matched group from each expression to compare): \n    settings[\"nameToCompare\"]\n\nformula_replacement_pattern: \"$v;lhs = ?;rhs\"\n\nformula_replacement:\n    if(is_formula,\n        string(\n            substitute(settings, expression(\"resultsequal(lhs, rhs, checkingType, checkingAccuracy)\"))\n        )\n    ,\n        \"lhs = rhs\"\n    )\n\nstudentCompare (The part of the student's expression to compare):\n    if(settings[\"mustMatchPattern\"]=\"\" or compareName=\"\",\n        replace(formula_replacement_pattern, formula_replacement, studentExpr)\n    ,\n        studentMatch[\"groups\"][compareName]\n    )\n\ncorrectCompare (The part of the correct expression to compare):\n    if(settings[\"mustMatchPattern\"]=\"\" or compareName=\"\",\n        replace(formula_replacement_pattern, formula_replacement, correctExpr)\n    ,\n        correctMatch[\"groups\"][compareName]\n    )\n\nfailNameToCompare (If comparing just a subexpression, stop marking if the student's expression doesn't have that subexpression):\n    assert(settings[\"mustMatchPattern\"]=\"\" or compareName=\"\" or (studentMatch[\"match\"] and compareName in studentMatch[\"groups\"]),\n        incorrect(settings[\"mustMatchMessage\"]);\n        end()\n    )\n\nstudentVariables (Variables used in the student's answer): \n    scope_case_sensitive(set(findvars(studentCompare)),settings[\"caseSensitive\"])\n\ncorrectVariables (Variables used in the correct answer):\n    scope_case_sensitive(set(findvars(correctCompare)),settings[\"caseSensitive\"])\n\nunexpectedVariables (Unexpected variables used in the student's answer):\n    let(uvars, filter(not (x in correctVariables),x,list(studentVariables)),\n        assert(not settings[\"checkVariableNames\"] or len(uvars)=0,\n            warn(translate(\"part.jme.unexpected variable name\",[\"name\":uvars[0]]));\n            feedback(translate(\"part.jme.unexpected variable name\",[\"name\":uvars[0]]))\n        );\n        uvars\n    )\n\nfailMinLength (Is the student's answer too short?):\n    assert(settings[\"minLength\"]=0 or len(cleanedStudentString)>=settings[\"minLength\"],\n        multiply_credit(settings[\"minLengthPC\"],settings[\"minLengthMessage\"]);\n        true\n    )\n\nfailMaxLength:\n    assert(settings[\"maxLength\"]=0 or len(cleanedStudentString)<=settings[\"maxLength\"],\n        multiply_credit(settings[\"maxLengthPC\"],settings[\"maxLengthMessage\"]);\n        true\n    )\n\nforbiddenStrings:\n    filter(x in cleanedStudentString, x, settings[\"notAllowed\"])\n\nforbiddenStringsPenalty:\n    assert(len(forbiddenStrings)=0,\n        translate(\n          if(len(settings[\"notAllowed\"])=1, 'part.jme.not-allowed one', 'part.jme.not-allowed several'),\n          [\"strings\":map(translate('part.jme.not-allowed bits',[\"string\":str]),str,forbiddenStrings)]\n        );\n        multiply_credit(settings[\"notAllowedPC\"],settings[\"notAllowedMessage\"]);\n        warn(settings[\"notAllowedMessage\"])\n    )\n\nrequiredStrings:\n    filter(not (x in cleanedStudentString), x, settings[\"mustHave\"])\n\nrequiredStringsPenalty:\n    assert(len(requiredStrings)=0,\n        translate(\n          if(len(settings[\"mustHave\"])=1, 'part.jme.must-have one', 'part.jme.must-have several'),\n          [\"strings\":map(translate('part.jme.must-have bits',[\"string\":str]),str,forbiddenStrings)]\n        );\n        multiply_credit(settings[\"mustHavePC\"],settings[\"mustHaveMessage\"]);\n        warn(settings[\"mustHaveMessage\"])\n    )\n\nvRange (The range to pick variable values from): \n    settings[\"vsetRangeStart\"]..settings[\"vsetRangeEnd\"] # 0\n\nanswerVariables (Variables used in either the correct answer or the student's answer):\n    correctVariables or studentVariables\n\nformula_match:\n  scope_case_sensitive(match(correctExpr,\"$v;lhs = ?;rhs\"),settings[\"caseSensitive\"])\n\nis_formula (Is the correct answer a formula of the form name = expression?):\n  formula_match[\"match\"]\n\nformula_variable (The variable on the left-hand side of the formula, if the correct answer is a formula):\n  try(string(formula_match[\"groups\"][\"lhs\"]),err,\"\")\n\nformula_expression (The right-hand side of the formula, if the correct answer is a formula):\n  formula_match[\"groups\"][\"rhs\"]\n\nformula_type (The type of value the formula produces, if the correct answer is a formula):\n  let(t,scope_case_sensitive(infer_type(formula_expression),settings[\"caseSensitive\"]),\n    if(t=\"name\",\"number\",t)\n  )\n\nvalue_generators (Expressions which generate values for each variable in the answer):\n    dict(map(\n        [\n          name,\n          get(\n            settings[\"valueGenerators\"],\n            name,\n            if(is_formula and name=formula_variable,\n              exec(function(\"random\"),[formula_expression,default_value_generator[formula_type]])\n            ,\n              default_value_generator[get(variable_types,name,\"number\")]\n            )\n          )\n        ],\n        name,\n        answerVariables\n    ))\n\nvariable_types (Inferred types for each of the variables):\n    scope_case_sensitive(infer_variable_types(correctExpr),settings[\"caseSensitive\"])\n\ndefault_value_generator:\n    [\n        \"number\": expression(\"random(vRange)\"),\n        \"decimal\": expression(\"dec(random(vRange))\"),\n        \"integer\": expression(\"int(random(vRange))\"),\n        \"rational\": expression(\"rational(random(vRange))\"),\n        \"matrix\": expression(\"matrix(repeat(repeat(random(vRange),3),3))\"),\n        \"vector\": expression(\"vector(repeat(random(vRange),3))\"),\n        \"boolean\": expression(\"random(true,false)\"),\n        \"set\": expression(\"set(repeat(random(vRange),5))\")\n    ]\n\nvset (The sets of variable values to test against):\n    try(\n        repeat(\n            scope_case_sensitive(make_variables(value_generators,vRange),settings[\"caseSensitive\"]),\n            settings[\"vsetRangePoints\"]\n        ),\n        message,\n        warn(translate(\"part.jme.error checking numerically\",[\"message\":message]));\n        fail(translate(\"part.jme.error checking numerically\",[\"message\":message]));\n        []\n    )\n\nagree (Do the student's answer and the expected answer agree on each of the sets of variable values?):\n    apply(vset);\n    map(\n        try(\n            scope_case_sensitive(resultsequal(unset(question_definitions,eval(studentCompare,vars)),unset(question_definitions,eval(correctCompare,vars)),settings[\"checkingType\"],settings[\"checkingAccuracy\"]),settings[\"caseSensitive\"]),\n            message,\n            warn(translate(\"part.jme.answer invalid\",[\"message\":message]));\n            fail(translate(\"part.jme.answer invalid\",[\"message\":message]));\n            false\n        ),\n        vars,\n        vset\n    )\n\nnumFails (The number of times the student's answer and the expected answer disagree):\n    apply(agree);\n    len(filter(not x,x,agree))\n\nnumericallyCorrect (Is the student's answer numerically correct?):\n    apply(numFails);\n    if(numFails<settings[\"failureRate\"],\n        correct(translate(\"part.jme.marking.correct\"))\n    ,\n        incorrect()\n    )\n\nsameVars (Does the student use the same variables as the correct answer?):\n    // Removed, but still defined so that older questions with custom marking algorithms don't break\n    nothing\n\nfailMatchPattern (Does the student's answer not match the required pattern?):\n    assert(settings[\"mustMatchPattern\"]=\"\",\n        assert(matches(studentExpr,settings[\"mustMatchPattern\"]),\n            if(compareName=\"\",\n                multiply_credit(settings[\"mustMatchPC\"], settings[\"mustMatchMessage\"])\n            ,\n                set_credit(0,settings[\"mustMatchMessage\"])\n            );\n            true\n        )\n    )\n\nmark:\n    apply(studentExpr);\n    apply(failNameToCompare);\n    apply(unexpectedVariables);\n    apply(sameVars);\n    apply(numericallyCorrect);\n    apply(failMinLength);\n    apply(failMaxLength);\n    apply(forbiddenStringsPenalty);\n    apply(requiredStringsPenalty);\n    apply(failMatchPattern)\n\ninterpreted_answer (The student's answer, to be reused by other parts):\n    apply(studentExpr);\n    studentExpr\n\n",
        "matrixentry": 
"rows (The number of rows in the student's answer): len(studentAnswer)\n\ncols (The number of columns in the student's answer): if(rows>0,len(studentAnswer[0]),0)\n\ncorrect_rows (The number of rows in the correct answer): len(settings['correctAnswer'])\n\ncorrect_cols (The number of columns in the correct answer): len(settings['correctAnswer'][0])\n\nnum_cells (The number of cells in the student's answer): rows*cols\n\ncell_indexes (The index of each cell in the student's answer): \n    product(list(0..rows-1), list(0..cols-1))\n\nstudent_cell_precisions (Precision the student used in each cell):\n    switch(\n        settings[\"precisionType\"]=\"dp\",\n            map(map(countdp(cell),cell,row), row, studentAnswer)\n        ,\n        settings[\"precisionType\"]=\"sigfig\",\n            map(map(countsigfigs(cell),cell,row), row, studentAnswer)\n        ,\n        map(map(0,cell,row),row,studentAnswer)\n    )\n\nall_same_precision:\n    if(len(student_cell_precisions)=0 or all(map(all(map(togivenprecision(c,settings[\"precisionType\"],student_cell_precisions[0][0],settings[\"strictPrecision\"]),c,row)),row,studentAnswer)),\n        true\n    ,\n        feedback(translate(\"part.matrix.not all cells same precision\"));\n        false\n    )\n\nstudentPrecision (Maximum precision student used, or the required precision, whichever's higher):\n    max(settings[\"precision\"], max(map(max(row),row,student_cell_precisions)))\n\nallowFractions: settings[\"allowFractions\"]\n\nallowedNotationStyles: [\"plain\",\"en\",\"si-en\"]\n\nstudentNumbers:\n    if(settings[\"allowFractions\"],\n        map(map(parsenumber_or_fraction(c, allowedNotationStyles), c, row), row, studentAnswer)\n    ,\n        map(map(parsenumber(c, allowedNotationStyles), c, row), row, studentAnswer)\n    )\n\nstudentMatrix (The student's answer, with each cell parsed to numbers): \n    matrix(studentNumbers)\n\nempty_cells (The positions of the cells in the student's answer which have been left empty):\n  filter(trim(studentAnswer[p[0]][p[1]])=\"\", p, cell_indexes)\n\nany_empty (Are any of the cells empty?):\n  assert(len(empty_cells)=0,\n    warn(translate(\"part.matrix.empty cell\"));\n    fail(translate(\"part.matrix.empty cell\"));\n    true\n  )\n\ninvalid_cells (The positions of the cells in the student's answer which can't be interpreted as numbers):\n    filter(isnan(studentNumbers[p[0]][p[1]]), p, cell_indexes)\n\nany_invalid (Are any of the cells invalid?):\n    assert(len(invalid_cells)=0,\n        warn(translate(\"part.matrix.invalid cell\"));\n        fail(translate(\"part.matrix.invalid cell\"));\n        true\n    )\n\nwrong_precision_cells (The indexes of the cells which are given to the wrong precision):\n    filter(not togivenprecision(studentAnswer[p[0]][p[1]], settings[\"precisionType\"], settings[\"precision\"], settings[\"strictPrecision\"]), p, cell_indexes)\n\nwrong_precision (Has every cell been given to the correct precision?):\n    assert(len(wrong_precision_cells)=0,\n        multiply_credit(settings['precisionPC'], settings[\"precisionMessage\"])\n    )\n\nwrong_size (Does the student's answer have the wrong dimensions?):\n    assert(rows=correct_rows and cols=correct_cols,\n        incorrect();\n        end()\n    )\n\nrounded_student_matrix (The student's answer, with each cell rounded to studentPrecision): \n    map(\n        switch(\n            settings[\"precisionType\"]=\"dp\",\n            precround(c, studentPrecision),\n            settings[\"precisionType\"]=\"sigfig\",\n            siground(c, studentPrecision),\n            c\n        ),\n        c,\n        studentMatrix\n    )\n\nrounded_correct_matrix:\n    map(\n        map(\n            switch(\n                settings[\"precisionType\"]=\"dp\",\n                precround(c, studentPrecision),\n                settings[\"precisionType\"]=\"sigfig\",\n                siground(c, studentPrecision),\n                c\n            ),\n            c,\n            row\n        ),\n        row,\n        settings[\"correctAnswer\"]\n    )\n\ncorrect_cells (The indexes of the cells which are correct):\n    filter(\n        if(p[0]<correct_rows and p[1]<correct_cols,\n            withintolerance(rounded_student_matrix[p[0]][p[1]], rounded_correct_matrix[p[0]][p[1]], settings['tolerance']),\n            false\n        ),\n        p, \n        cell_indexes\n    )\n\nmark:\n    apply(any_empty);\n    apply(any_invalid);\n    assert(settings[\"precisionType\"]=\"none\" and not settings[\"allowFractions\"], apply(all_same_precision));\n    apply(wrong_size);\n    if(len(correct_cells)=len(cell_indexes),\n        correct()\n    ,\n        if(settings['markPerCell'],\n            set_credit(len(correct_cells)/num_cells,translate('part.matrix.some incorrect',[\"count\":num_cells-len(correct_cells)]))\n        ,\n            incorrect();\n            end()\n        )\n    );\n    apply(wrong_precision)\n\ninterpreted_answer (The student's answer, to be reused by other parts):\n    apply(any_empty);\n    apply(any_invalid);\n    studentMatrix\n",
        "multipleresponse": 
"numAnswers: len(settings[\"matrix\"])\n\nnumChoices: if(numAnswers=1,1,len(settings[\"matrix\"][0]))\n\nnumTicks (How many options did the student tick?):\n  sum(map(sum(map(if(x,1,0),x,row)),row,studentAnswer))\n\nwrongNumber:\n  assert(numTicks >= settings[\"minAnswers\"] and (settings[\"maxAnswers\"]=0 or numTicks<=settings[\"maxAnswers\"]),\n    if(settings[\"warningType\"]=\"prevent\",\n        fail(translate(\"part.mcq.wrong number of choices\"))\n    ,\n        incorrect(translate(\"part.mcq.wrong number of choices\"));\n        end()\n    )\n  )\n\ntick_indexes (Indexes of choice/answer pairs):\n    flatten(map(\n        map([x,y], x, shuffleAnswers),\n        y,\n        shuffleChoices\n    ))\n\nonly_ticked_score_ticks (The score for each choice/answer pair):\n  map(\n    if(studentAnswer[x][y],\n      let(distractor,settings[\"distractors\"][x][y], credit, if(marks=0,0,settings[\"matrix\"][x][y]/marks),\n        switch(\n          credit<>0,\n            if(not isnonemptyhtml(distractor),\n              add_credit(credit,translate(if(credit>0,'part.mcq.correct choice','part.mcq.incorrect choice')))\n            ,\n              add_credit(credit,distractor)\n            )\n          ,\n            if(isnonemptyhtml(distractor),negative_feedback(distractor),if(marks<>0,negative_feedback(translate('part.mcq.incorrect choice')),false))\n        );credit\n      )\n    ,\n      0\n    ),\n    [x,y],\n    tick_indexes\n  )\n\n\nlayout_tick_indexes (Indexes of choice/answer pairs shown in the layout):\n    filter(layout[tick[0]][tick[1]],tick,tick_indexes)\n\nbinary_score_ticks (Scores and feedback for each choice/answer pair, in the \"binary\" marking method):\n    let(\n        per_tick, 1/len(layout_tick_indexes),\n        scores,map(\n            let(distractor,settings[\"distractors\"][x][y],\n                should_tick, settings[\"matrix\"][x][y]>0,\n                if(studentAnswer[x][y]=should_tick,\n                    per_tick\n                ,\n                    assert(not isnonemptyhtml(distractor),negative_feedback(distractor));\n                    0\n                )\n            ),\n            [x,y],\n            layout_tick_indexes\n        ),\n        total, sum(scores),\n        switch(\n            total=1,correct(),\n            total=0 or settings[\"markingMethod\"]=\"all-or-nothing\",incorrect(),\n            set_credit(total,translate('part.marking.partially correct'))\n        )\n    )\n\nscore_ticks:\n    switch(\n        settings[\"markingMethod\"] in [\"score per matched cell\",\"all-or-nothing\"], apply(binary_score_ticks);binary_score_ticks,\n        apply(only_ticked_score_ticks);only_ticked_score_ticks\n    )\n\ntotal_score: \n    sum(score_ticks)\n\nmark:\n  assert(marks>0,correct());  // any answer is correct when 0 marks are available\n  assert(settings[\"markingMethod\"]<>\"sum ticked cells\" or numTicks>0,\n    warn(translate(\"part.marking.nothing entered\"));\n    fail(translate(\"part.marking.nothing entered\"))\n  );\n  apply(wrongNumber);\n  apply(score_ticks)\n\ninterpreted_answer (The student's answer, to be reused by other parts):\n  studentAnswer\n",
        "numberentry": 
"studentNumber (The student's answer, parsed as a number):\n    if(settings[\"allowFractions\"],\n        parsedecimal_or_fraction(studentAnswer,settings[\"notationStyles\"])\n    ,\n        parsedecimal(studentAnswer,settings[\"notationStyles\"])\n    )\n\nisInteger (Is the student's answer an integer?):\n    countdp(studentAnswer)=0\n\nisFraction (Is the student's answer a fraction?):\n    \"/\" in studentAnswer\n\nnumerator (The numerator of the student's answer, or 0 if not a fraction):\n    if(isFraction,\n        parsenumber(split(studentAnswer,\"/\")[0],settings[\"notationStyles\"])\n    ,\n        0\n    )\n\ndenominator (The numerator of the student's answer, or 0 if not a fraction):\n    if(isFraction,\n        parsenumber(split(studentAnswer,\"/\")[1],settings[\"notationStyles\"])\n    ,\n        0\n    )\n\ncancelled (Is the student's answer a cancelled fraction?):\n    assert(isFraction and gcd(numerator,denominator)=1,\n        assert(not settings[\"mustBeReduced\"],\n            multiply_credit(settings[\"mustBeReducedPC\"],translate(\"part.numberentry.answer not reduced\"))\n        );\n        false\n    )\n\ncleanedStudentAnswer:\n    cleannumber(studentAnswer, settings[\"notationStyles\"])\n\nstudent_is_scientific (Is the student's answer written in scientific notation?):\n    not isnan(matchnumber(studentAnswer, [\"scientific\"])[1])\n\nscientific_precision_offset (A number in scientific notation has 1 more significant digit than decimal places):\n    award(1,settings[\"precisionType\"]=\"dp\")\n\nstudentPrecision:\n    max(settings[\"precision\"],\n        switch(\n            student_is_scientific, countsigfigs(studentAnswer)-scientific_precision_offset,\n            settings[\"precisionType\"]=\"dp\", max(settings[\"precision\"],countdp(cleanedStudentAnswer)),\n            settings[\"precisionType\"]=\"sigfig\", max(settings[\"precision\"],countsigfigs(cleanedStudentAnswer)),\n            0\n        )\n    )\n\nraw_minvalue:\n    switch(\n        student_is_scientific, siground(settings[\"minvalue\"],studentPrecision+scientific_precision_offset),\n        settings[\"precisionType\"]=\"dp\", precround(settings[\"minvalue\"],studentPrecision),\n        settings[\"precisionType\"]=\"sigfig\", siground(settings[\"minvalue\"],studentPrecision),\n        settings[\"minvalue\"]\n    )\n\nraw_maxvalue:\n    switch(\n        student_is_scientific, siground(settings[\"maxvalue\"],studentPrecision+scientific_precision_offset),\n        settings[\"precisionType\"]=\"dp\", precround(settings[\"maxvalue\"],studentPrecision),\n        settings[\"precisionType\"]=\"sigfig\", siground(settings[\"maxvalue\"],studentPrecision),\n        settings[\"maxvalue\"]\n    )\n\nminvalue: min(raw_minvalue,raw_maxvalue)\n\nmaxvalue: max(raw_minvalue,raw_maxvalue)\n\nvalidNumber (Is the student's answer a valid number?):\n    if(isnan(studentNumber),\n        warn(translate(\"part.numberentry.answer invalid\"));\n        fail(translate(\"part.numberentry.answer invalid\"))\n    ,\n        true\n    )\n\nnumberInRange (Is the student's number in the allowed range?):\n    if(studentNumber>=minvalue and studentNumber<=maxvalue,\n        correct()\n    ,\n        incorrect();\n        end()\n    )\n\ncorrectPrecision (Has the student's answer been given to the desired precision?):     \n    if(\n        if(student_is_scientific,\n            togivenprecision_scientific(studentAnswer,settings['precisionType'],settings['precision']),\n            togivenprecision(cleanedStudentAnswer,settings['precisionType'],settings['precision'],settings[\"strictPrecision\"])\n        )\n    ,\n        true\n    ,\n        multiply_credit(settings[\"precisionPC\"],settings[\"precisionMessage\"]);\n        false\n    )\n\nmark (Mark the student's answer):\n    apply(validNumber);\n    apply(numberInRange);\n    assert(numberInRange,end());\n    if(isFraction,\n        apply(cancelled)\n    ,\n        apply(correctPrecision)\n    )\n \ninterpreted_answer (The student's answer, to be reused by other parts):\n    apply(validNumber);\n    studentNumber\n\n",
        "patternmatch": 
"regex_match (Match the student's answer with the correct answer, interpreted as a regular expression):\n  match_regex(settings[\"correctAnswer\"],studentAnswer,\"u\")\n\nregex_match_case_insensitive (Match the student's answer with the correct answer, interpreted as a case-insensitive regular expression):\n  match_regex(settings[\"correctAnswer\"],studentAnswer,\"iu\")\n\nexact_match (Is the student's answer exactly the correct answer?):\n  studentAnswer=settings[\"correctAnswer\"]\n\nexact_match_case_insensitive (Is the student's answer exactly the correct answer?):\n  lower(studentAnswer)=lower(settings[\"correctAnswer\"])\n\nmatches (Does the student's answer match the correct answer?):\n  switch(\n    settings[\"matchMode\"]=\"regex\", len(regex_match)>0,\n    settings[\"matchMode\"]=\"exact\", exact_match,\n    false\n  )\n      \nmatches_case_insensitive (Does the student's answer match the correct answer, ignoring case?):\n  switch(\n    settings[\"matchMode\"]=\"regex\", len(regex_match_case_insensitive)>0,\n    settings[\"matchMode\"]=\"exact\", exact_match_case_insensitive,\n    false\n  )\n     \n\nmark:\n  assert(len(studentAnswer)>0,\n    warn(translate(\"part.marking.nothing entered\"));\n    fail(translate(\"part.marking.nothing entered\"))\n  );\n  if(settings[\"caseSensitive\"],\n    if(matches,\n      correct(),\n      if(matches_case_insensitive,\n        set_credit(settings[\"partialCredit\"],translate(\"part.patternmatch.correct except case\")),\n        incorrect()\n      )\n    )\n  ,\n    if(matches_case_insensitive,\n      correct()\n    ,\n      incorrect()\n    )\n  )\n\ninterpreted_answer (The student's answer, to be reused by other parts):\n  studentAnswer\n"
    };
});
