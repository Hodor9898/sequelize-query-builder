import Sequelize = require("sequelize");
const Op = Sequelize.Op;

export enum CONNECTING_OPERATORS {
  OR = "OR",
  AND = "AND"
}

export enum OPERATORS {
  EQ = "EQ",
  NOT = "NOT",
  IN = "IN",
  NOTIN = "NOTIN",
  BETWEEN = "BETWEEN",
  NOTBETWEEN = "NOTBETWEEN",
  LT = "LT",
  LTE = "LTE",
  GT = "GT",
  GTE = "GTE",
  NULL = "NULL",
  LIKE = "LIKE",
  NOTLIKE = "NOTLIKE"
}

const SEQUELIZE_OP_MAP: {
  [key: string]: any;
} = {
  [CONNECTING_OPERATORS.OR]: Op.or,
  [CONNECTING_OPERATORS.AND]: Op.and,
  [OPERATORS.EQ]: Op.eq,
  [OPERATORS.NOT]: Op.not,
  [OPERATORS.IN]: Op.in,
  [OPERATORS.NOTIN]: Op.notIn,
  [OPERATORS.BETWEEN]: Op.between,
  [OPERATORS.NOTBETWEEN]: Op.notBetween,
  [OPERATORS.LT]: Op.lt,
  [OPERATORS.LTE]: Op.lte,
  [OPERATORS.GT]: Op.gt,
  [OPERATORS.GTE]: Op.gte,
  [OPERATORS.NULL]: Op.is,
  [OPERATORS.LIKE]: Op.like,
  [OPERATORS.NOTLIKE]: Op.notLike
};

const OPERTAOR_VALUE_TRANSFORMER: {
  [key: string]: any;
} = {
  [OPERATORS.LIKE]: (val: string) => `%${val}%`,
  [OPERATORS.NOTLIKE]: (val: string) => `%${val}%`,
  [OPERATORS.IN]: (val: string) => val.split("-."),
  [OPERATORS.BETWEEN]: (val: string) => val
};

module.exports.SequelizeQueryStringParser = (req: any, res: any, next: any) => {
  const { filter, order, page, perPage } = req.query;

  /**
   * Parse query string into sequelize readable objects
   */
  const sFilter = filter ? parseFilter(filter) : null;
  const sOrder = order ? parseOrder(order) : null;

  /**
   * Set the sequelize query object to the request so that it can be used later
   */
  req.sequelizeOptions = {
    limit: perPage ? perPage : null,
    offset: perPage && page ? perPage * page : null,
    order: [sOrder],
    where: sFilter
  };

  next();
};

const parseFilter = (filterObject: {
  op: string;
  key: string;
  value: any;
}): any => {
  const { op = null, key = null, value = null } = filterObject;

  if (op === null) {
    return null;
  }

  if (Object.values(CONNECTING_OPERATORS).includes(op)) {
    return {
      [SEQUELIZE_OP_MAP[op]]: value.map((val: any) => ({
        ...parseFilter(val)
      }))
    };
  }

  if (Object.values(OPERATORS).includes(op) && key !== null) {
    return {
      [key]: {
        [SEQUELIZE_OP_MAP[op]]: OPERTAOR_VALUE_TRANSFORMER[op]
          ? OPERTAOR_VALUE_TRANSFORMER[op](value)
          : value
      }
    };
  }

  return null;
};

const parseOrder = (orderString: string) => {
  return orderString.split(" ");
};
