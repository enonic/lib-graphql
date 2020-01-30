package com.enonic.lib.graphql;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;

import jdk.nashorn.api.scripting.ScriptObjectMirror;

import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapGeneratorBase;
import com.enonic.xp.script.serializer.MapSerializable;
import com.enonic.xp.util.Exceptions;

public final class MapMapper
    implements MapSerializable
{
    private final Map<?, ?> value;

    public MapMapper( final Map<?, ?> value )
    {
        this.value = value;
    }

    @Override
    public void serialize( final MapGenerator gen )
    {
        if ( this.value != null )
        {
            serializeMap( gen, this.value );
        }
    }

    public static void serializeMap( final MapGenerator gen, final Map<?, ?> map )
    {
        for ( final Map.Entry<?, ?> entry : map.entrySet() )
        {
            serializeKeyValue( gen, entry.getKey().toString(), entry.getValue() );
        }
    }

    public static void serializeKeyValue( final MapGenerator gen, final String key, final Object value )
    {
        if ( value instanceof List )
        {
            serializeList( gen, key, (List<?>) value );
        }
        else if ( value instanceof Map )
        {
            serializeMap( gen, key, (Map<?, ?>) value );
        }
        //Temporary workaround. Remove as soon as __.toNativeObject allows to return null values
        else if ( value == null )
        {
            try
            {
                final Field currentField = MapGeneratorBase.class.getDeclaredField( "current" );
                currentField.setAccessible( true );
                final Object map = currentField.get( gen );
                ( (ScriptObjectMirror) map ).put( key, value );
            }
            catch ( NoSuchFieldException | IllegalAccessException e )
            {
                throw Exceptions.unchecked( e );
            }
        }
        else
        {
            gen.value( key, value );
        }
    }

    public static void serializeList( final MapGenerator gen, final String key, final List<?> values )
    {
        gen.array( key );
        for ( final Object value : values )
        {
            serializeValue( gen, value );
        }
        gen.end();
    }

    public static void serializeMap( final MapGenerator gen, final String key, final Map<?, ?> map )
    {
        gen.map( key );
        serializeMap( gen, map );
        gen.end();
    }

    public static void serializeValue( final MapGenerator gen, final Object value )
    {
        if ( value instanceof Map )
        {
            gen.map();
            serializeMap( gen, (Map<?, ?>) value );
            gen.end();
        }
        else
        {
            gen.value( value );
        }
    }
}
