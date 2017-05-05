package com.enonic.lib.graphql;

import com.enonic.xp.testing.script.ScriptRunnerSupport;

public class GraphqlScriptLibTest
    extends ScriptRunnerSupport
{
    @Override
    public String getScriptTestFile()
    {
        return "/lib/graphql-test.js";
    }
}
