import { BaseMiddleware, BLOCK_CHAIN } from 'lynx-framework/base.middleware';
import { Middleware } from 'lynx-framework/decorators';
import { Request, Response} from 'express';
import AdminUIModule from '..';

/**
 * 
 * @param url 
 * @returns name of enitity
 */
function getEntityName(url: string): string {
  const regex = /(adminUI\/)(\w*)/;
  const match = url.match(regex);

  if (null === match) {
    return 'unknown';
  }

  return match[2];
}

@Middleware('/adminUI/*')
export default class PermissionMiddleware extends BaseMiddleware {
    async apply(req: Request, res: Response) {
        const entityName = getEntityName(req.originalUrl);
        const method = req.method;
        let canAccess;

        switch(method) {
          case 'GET':
            canAccess = AdminUIModule.canReadFunction(req, entityName);
            break;
          case 'POST': 
            canAccess = AdminUIModule.canWriteFunction(req, entityName);
            break;
          default: 
            canAccess = false;
        }

        if (false === canAccess) {
            AdminUIModule.permissionDeniedHandler(req, res, entityName);
            return BLOCK_CHAIN;
        }
    }
}