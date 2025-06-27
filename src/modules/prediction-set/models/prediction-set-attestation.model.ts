import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { JSONParser } from '../../../lib/parsers';

/**
 * Attestation proof interface.
 */
export interface AttestationProof {
  response_hex: string;
  attestation_type: string;
  proof: string[];
}

/**
 * Prediction set attestation.
 */
export class PredictionSetAttestation extends AdvancedSQLModel {
  /**
   * Prediction set's attestation table.
   */
  public tableName = DbTables.PREDICTION_SET_ATTESTATION;

  /**
   * Prediction set ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public prediction_set_id: number;

  /**
   * Data source ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public data_source_id: number;

  /**
   * Attestation round ID.
   */
  @prop({
    parser: {
      resolver: integerParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER]
  })
  roundId: number;

  /**
   * Attestation ABI encoded request.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER]
  })
  abiEncodedRequest: string;

  /**
   * Attestation full proof.
   */
  @prop({
    parser: {
      resolver: JSONParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    defaultValue: () => null,
    emptyValue: () => null
  })
  proof: AttestationProof;
}
