# coding=utf-8
from __future__ import absolute_import, division, unicode_literals
import app, sys
import datetime as dt
import exec_anaconda
exec_anaconda.exec_anaconda()
import numpy as np
import pygal
import pandas as pd
from splunklib.searchcommands import dispatch, ReportingCommand, Configuration, Option, validators

reload(sys)
sys.setdefaultencoding('utf-8')

def tryparse(s):
    try:
        if s != '':
            return float(s)
        else:
            return np.nan
    except:
        return s

@Configuration(requires_preop=False)
class Svg(ReportingCommand):   
    data = Option(require=False)
    folder = Option(require=False)
    filename = Option(require=False)

    @Configuration()
    def map(self, records):
        for record in records:
            yield record
            
    @Configuration(requires_preop=False)
    def reduce(self, records):
    	data = {}
        for record in records:
            for key in record.keys():
                if key in data.keys():
                    data[key].append(tryparse(record[key]))
                else:
                    data[key] = [tryparse(record[key])]

        df = pd.DataFrame()
        for key in data.keys():
            df[key] = data[key]

        excl_cols = ['_time', '_span', '_spandays']
        data_cols = [c.strip() for c in self.data.split(',')] if self.data else df.columns
        cols = [col for col in df.columns if (col in data_cols) and (col not in excl_cols)]
        line_chart = pygal.Line(x_label_rotation=20)
        x_labels = df._time.values
        line_chart.x_labels = x_labels       
        for col in cols:
            line_chart.add(col, list(df[col].values))
        output = line_chart.render()

        if self.folder:
            if self.filename:
                filename = self.filename
            else:
                import hashlib
                s = self.folder + str(np.random.random(1000)) + str(dt.datetime.now())
                filename = hashlib.md5(s).hexdigest() + '.svg'

            import os
            path = os.path.join(self.folder, filename)
            line_chart.render_to_file(path)
            yield {'svg': path}
        else:
            yield {'svg': output}
            
dispatch(Svg, sys.argv, sys.stdin, sys.stdout, __name__)
