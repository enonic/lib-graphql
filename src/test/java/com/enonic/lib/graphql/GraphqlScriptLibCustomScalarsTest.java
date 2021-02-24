package com.enonic.lib.graphql;

import com.enonic.xp.testing.ScriptRunnerSupport;

public class GraphqlScriptLibCustomScalarsTest
    extends ScriptRunnerSupport
{
    @Override
    public String getScriptTestFile()
    {
        return "/lib/graphql-custom-scalars-test.js";
    }
}
