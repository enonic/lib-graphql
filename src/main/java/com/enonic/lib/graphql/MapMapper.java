package com.enonic.lib.graphql;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;

import com.enonic.xp.script.serializer.MapGenerator;
import com.enonic.xp.script.serializer.MapGeneratorBase;
import com.enonic.xp.script.serializer.MapSerializable;

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
        else if ( value == null )
        {
            //Temporary workaround. XP < 7.8 ignores null values in MapGenerator. XP >= 7.8 gen.rawValue( key, null ) stores null
            if ( gen instanceof MapGeneratorBase )
            {
                try
                {
                    final Field currentField = MapGeneratorBase.class.getDeclaredField( "current" );
                    currentField.setAccessible( true );
                    final Object map = currentField.get( gen );
                    if ( map instanceof Map ) // On Nashorn it is true. On GraalJS it is false.
                    {
                        ( (Map) map ).put( key, null );
                    }
                    else
                    {
                        gen.rawValue( key, null );
                    }
                }
                catch ( NoSuchFieldException | IllegalAccessException e )
                {
                    gen.rawValue( key, null );
                }
            }
            else
            {
                gen.rawValue( key, null );
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
