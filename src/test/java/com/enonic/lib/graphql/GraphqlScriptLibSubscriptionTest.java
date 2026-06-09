package com.enonic.lib.graphql;

import com.enonic.xp.testing.ScriptRunnerSupport;

public class GraphqlScriptLibSubscriptionTest
    extends ScriptRunnerSupport
{
    @Override
    public String getScriptTestFile()
    {
        return "/lib/graphql-subscription-test.js";
    }
}
