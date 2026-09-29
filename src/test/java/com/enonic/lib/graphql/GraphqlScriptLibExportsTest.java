package com.enonic.lib.graphql;

import com.enonic.xp.testing.ScriptRunnerSupport;

public class GraphqlScriptLibExportsTest
    extends ScriptRunnerSupport
{
    @Override
    public String getScriptTestFile()
    {
        return "/lib/graphql-exports-test.js";
    }
}
