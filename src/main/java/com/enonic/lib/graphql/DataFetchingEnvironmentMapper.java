package com.enonic.lib.graphql;

import graphql.schema.DataFetchingEnvironment;

import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapSerializable;

public final class DataFetchingEnvironmentMapper
    implements MapSerializable
{
    private final DataFetchingEnvironment env;

    public DataFetchingEnvironmentMapper( final DataFetchingEnvironment env )
    {
        this.env = env;
    }

    @Override
    public void serialize( final MapGenerator gen )
    {
        MapMapper.serializeKeyValue( gen, "source", this.env.getSource() );
        MapMapper.serializeKeyValue( gen, "args", this.env.getArguments() );
    }
}
