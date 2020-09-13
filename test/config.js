require('dotenv').config();

const BBOX = `ST_Transform(ST_MakeEnvelope({minx}, {miny}, {maxx}, {maxy}, 3857), 4326)`;

module.exports ={
  db: {
    user:process.env.db_user,
    password:process.env.db_password,
    host:process.env.db_host,
    post:process.env.db_port,
    database:'rwss_assets',
  },
  format:{
    type: 'mbtiles',
    output: __dirname + '/parcels.mbtiles',
    metadata: {
      "name": "rwanda-parcels",
      "description":"parcels data in vector tiles",
      "format":"pbf",
      "version": 1,
      "minzoom": 15,
      "maxzoom": 15,
      "center": "30.060,-1.945, 15",
      "bounds": "28.861730820621, -2.84023010213741, 30.8997466415943, -1.04716670707785",
      "type": "overlay",
      "json": `{"vector_layers": [ { "id": "parcels", "description": "", "minzoom": 15, "maxzoom": 15, "fields": {} },{ "id": "parcels_annotation", "description": "", "minzoom": 15, "maxzoom": 15, "fields": {} } ] }`
    },
  },
  // format:{
  //   type: 'pbf',
  //   output: __dirname + '/tile',
  // },
  layers : [
    {
      name: 'parcels',
      buffer: 2,
      minzoom: 15,
      maxzoom:15,
      query:`
      WITH final as(
        SELECT
        'Feature' AS type,
        ST_Intersection(ST_Buffer(x.geom, 0.0000001), ST_Buffer(${BBOX}, 0.0000001)) AS geom,
        row_to_json((
          SELECT p FROM (
          SELECT
            x.fid as id,
            x."Parcel_ID" parcel_no
          ) AS p
        )) AS properties
        FROM parcels x
        WHERE NOT ST_IsEmpty(x.geom)
        AND x.geom && ST_Buffer(${BBOX}, 0.0000001)
      )
      SELECT row_to_json(featurecollection) AS json FROM (
        SELECT
          'FeatureCollection' AS type,
          array_to_json(array_agg(feature)) AS features
        FROM (
          SELECT
          x.type,
          ST_AsGeoJSON(x.geom)::json AS geometry,
          x.properties
          FROM final x
          WHERE NOT ST_IsEmpty(x.geom)
        ) AS feature
      ) AS featurecollection
      `
    },
    {
      name: 'parcels_annotation',
      buffer: 0,
      minzoom: 15,
      maxzoom:15,
      query:`
      WITH final as(
        SELECT
        'Feature' AS type,
        ST_Intersection(ST_Buffer(x.geom, 0.0000001), ST_Buffer(${BBOX}, 0.0000001)) AS geom,
        row_to_json((
          SELECT p FROM (
          SELECT
            x.fid as id,
            x."Parcel_ID" parcel_no
          ) AS p
        )) AS properties
        FROM parcels x
        WHERE NOT ST_IsEmpty(x.geom)
        AND x.geom && ST_Buffer(${BBOX}, 0.0000001)
      )
      SELECT row_to_json(featurecollection) AS json FROM (
        SELECT
          'FeatureCollection' AS type,
          array_to_json(array_agg(feature)) AS features
        FROM (
          SELECT
          x.type,
          ST_AsGeoJSON(ST_CENTROID(x.geom))::json AS geometry,
          x.properties
          FROM final x
          WHERE NOT ST_IsEmpty(x.geom)
        ) AS feature
      ) AS featurecollection
      `
    },
  ]
}